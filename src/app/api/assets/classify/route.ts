import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"

// 模块级缓存：5 分钟过期，避免每次请求都调 OpenRouter API
let cachedVisionModels: string[] = []
let cacheExpireAt = 0

async function fetchFreeVisionModels(): Promise<string[]> {
  const now = Date.now()
  if (cachedVisionModels.length > 0 && now < cacheExpireAt) {
    return cachedVisionModels
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      cache: "no-store",
      next: { revalidate: 300 },
    })
    const json = await res.json()
    const models = (json.data || [])
      .filter((m: any) => m.pricing.prompt === "0" && m.pricing.completion === "0")
      .filter((m: any) => m.architecture?.input_modalities?.includes("image"))
      .slice(0, 5)
      .map((m: any) => m.id)

    if (models.length > 0) {
      cachedVisionModels = models
      cacheExpireAt = now + 5 * 60 * 1000 // 5 分钟
      console.log("[classify] 已缓存免费视觉模型:", models)
    }
    return models
  } catch (err: any) {
    console.error("[classify] 获取免费视觉模型失败:", err?.message)
    return []
  }
}

const typeLabels: Record<string, string> = {
  production_line: "生产线",
  spray_line: "喷涂线",
  raw_material: "原材料",
  finished_product: "成品",
  packing_shipping: "打包发货",
  detail_closeup: "细节特写",
  color_swatch: "色板",
  ai_render: "AI效果图",
  construction: "现场施工安装",
}

const classificationPrompt = `你是铝单板工厂的素材分类专家。分析这张图片，判断它属于以下哪个类别，只返回类别英文 key，不要解释。

关键判断规则：
- 如果是小块的色板、色卡、颜色样板（通常放在桌上、手拿着、多色并排）→ color_swatch
- 如果是大块的铝板、安装在建筑上的金属板、完成的幕墙产品 → finished_product
- 如果是3D渲染效果图、电脑制图、合成图 → ai_render
- 如果是工地现场、工人安装、脚手架、打胶、固定挂件 → construction

具体类别：
- color_swatch: 色板/色卡（小尺寸、多色并排、手拿、桌面展示、木纹石纹转印样片）
- finished_product: 成品（大块铝单板、建筑幕墙、安装后的效果、单独成品板）
- production_line: 生产线（车间机器、开料折边焊接打磨、工人操作设备）
- spray_line: 喷涂线（喷漆房内、粉末喷枪、氟碳喷涂、挂具挂板、烘烤炉）
- raw_material: 原材料（铝板卷材、未加工的铝卷铝板、板材成堆堆放）
- packing_shipping: 打包发货（木架木箱包装、装车运输、仓库堆货待发）
- detail_closeup: 细节特写（板材表面纹理、钻孔、角码、加强筋、焊接缝）
- ai_render: AI效果图（3D渲染、建筑外观效果图、电脑合成、非真实拍摄）
- construction: 现场施工安装（工地现场、工人安装作业、脚手架、打胶固定、挂件连接、幕墙施工现场）

只返回一个单词`

export async function POST(request: Request) {
  const { assetId } = await request.json()
  const apiKey = request.headers.get("x-api-key") || ""
  const visionModel = request.headers.get("x-vision-model") || ""

  if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 400 })

  try {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } })
    if (!asset) return NextResponse.json({ error: "素材不存在" }, { status: 404 })
    if (asset.typeSource === "manual") {
      return NextResponse.json({
        type: asset.type,
        label: typeLabels[asset.type],
        skipped: true,
        message: "手动标注，已跳过",
      })
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "XHS Content Tool",
      },
    })

    const defaultVisionModels = await fetchFreeVisionModels()
    const fallbackModels = defaultVisionModels.length > 0
      ? defaultVisionModels
      : [
          "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
          "google/gemma-4-31b-it:free",
          "google/gemma-4-26b-a4b-it:free",
        ]

    const visionModels = visionModel ? [visionModel] : fallbackModels

    // 本地图片转为 base64 data URI，OpenRouter 无法访问 localhost URL
    let imageUrl = asset.url
    if (imageUrl.startsWith("/")) {
      try {
        const relativePath = imageUrl.replace(/^\//, "")
        const filePath = join(process.cwd(), "public", relativePath)
        console.log("[classify] 读取图片:", filePath)
        const buffer = await readFile(filePath)
        const base64 = buffer.toString("base64")
        const ext = imageUrl.split(".").pop()?.toLowerCase() || "jpeg"
        const mimeMap: Record<string, string> = {
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          webp: "image/webp",
          gif: "image/gif",
        }
        const mime = mimeMap[ext] || "image/jpeg"
        imageUrl = `data:${mime};base64,${base64}`
      } catch (err: any) {
        console.error("[classify] 读取本地图片失败:", err?.message, err?.code)
        return NextResponse.json({ error: "无法读取图片文件: " + err?.message }, { status: 500 })
      }
    }

    let detectedType = "finished_product"
    let lastError = ""

    for (const model of visionModels) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: classificationPrompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
        })

        const rawType = completion.choices[0]?.message?.content?.trim().toLowerCase() || ""
        const validTypes = Object.keys(typeLabels)
        detectedType = validTypes.find((t) => rawType === t || rawType.includes(t)) || "finished_product"
        lastError = ""
        break
      } catch (err: any) {
        lastError = err?.message || "未知错误"
        if (err?.status === 429 || err?.status === 402 || err?.status === 403) break
      }
    }

    if (lastError) return NextResponse.json({ error: lastError }, { status: 500 })

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: { type: detectedType, typeSource: "ai" },
    })

    return NextResponse.json({ type: detectedType, label: typeLabels[detectedType] })
  } catch (err: any) {
    console.error("[classify] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message || "分类失败" }, { status: 500 })
  }
}