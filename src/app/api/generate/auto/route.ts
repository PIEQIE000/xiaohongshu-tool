import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { callOpenRouterWithFallback } from "@/lib/openrouter"
import { builtInTemplates } from "@/data/prompt-templates"
import { renderPrompt } from "@/lib/prompt-engine"

const typeToTemplate: Record<string, string> = {
  factory_real: "auto-factory-real",
  ai_render: "auto-ai-render",
  knowledge: "auto-knowledge",
  shipping: "auto-shipping",
}

const typeToAssetTypes: Record<string, string[]> = {
  factory_real: ["production_line", "spray_line", "packing_shipping"],
  ai_render: ["ai_render"],
  knowledge: [],
  shipping: ["packing_shipping"],
}

function parseModels(raw: string): string[] {
  if (!raw) return []
  return raw.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean)
}

export async function POST(request: Request) {
  const { contentType, model, scheduleDate } = await request.json()
  const apiKey = request.headers.get("x-api-key") || ""
  const models = parseModels(model)

  if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 400 })
  if (models.length === 0) return NextResponse.json({ error: "模型列表为空" }, { status: 400 })

  const templateId = typeToTemplate[contentType] || "auto-knowledge"
  const template = builtInTemplates.find((t) => t.id === templateId)
  if (!template) return NextResponse.json({ error: "模板不存在" }, { status: 400 })

  const formValues: Record<string, string> = {
    选题: contentType === "factory_real" ? "工厂实拍" : contentType === "shipping" ? "发货展示" : "干货科普",
    生产环节: "开料→折边→焊接→打磨→喷涂",
    颜色工艺: "氟碳喷涂 / 木纹转印 / 石纹效果",
    推荐场景: "商场、写字楼、酒店大堂",
    知识要点: "铝单板厚度选择、安装注意事项、常见误区",
    发货内容: "木架打包、专线发货",
    emoji数量: "3",
    标签数量: "5",
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "XHS Content Tool",
    },
  })

  try {
    const assetTypes = typeToAssetTypes[contentType] || []
    let images = ""

    if (contentType === "knowledge") {
      const assets = await prisma.asset.findMany({
        where: { isFatigued: false },
        take: 1,
        orderBy: { usageCount: "asc" },
      })
      images = assets.map((a) => a.url).join(",")
    } else if (assetTypes.length > 0) {
      const assets = await prisma.asset.findMany({
        where: { type: { in: assetTypes }, isFatigued: false },
        orderBy: { usageCount: "asc" },
        take: contentType === "factory_real" ? 9 : 6,
      })
      images = assets.map((a) => a.url).join(",")

      if (images) {
        await prisma.asset.updateMany({
          where: { url: { in: assets.map((a) => a.url) } },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
        })
      }
    }

    const prompt = renderPrompt(template.content, formValues)
    const result = await callOpenRouterWithFallback(openai, models, prompt)

    const publishHook = "私信发图纸，源头工厂直接报价。主页有联系方式，没有中间商差价。"
    const body = result.content + "\n\n" + publishHook

    const content = await prisma.content.create({
      data: {
        title: formValues["选题"],
        body,
        contentType,
        images,
        tags: contentType,
        publishHook,
      },
    })

    if (scheduleDate) {
      await prisma.calendarEntry.create({
        data: { contentId: content.id, date: scheduleDate },
      })
    }

    return NextResponse.json({ content: result.content, body, contentType, images, id: content.id })
  } catch (err: any) {
    console.error("[auto-generate] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message || "自动生成失败" }, { status: 500 })
  }
}