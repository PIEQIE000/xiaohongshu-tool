import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { parseModelsWithFallback } from "@/lib/model-try"

const IMAGE_PLAN_SYSTEM = `你是一个小红书内容配图策划师。根据文章内容，规划需要几张配图、每张图描述什么场景。

## 工作流程
1. 阅读文章，识别文章中有几个不同的场景/阶段/关键点
2. 为每个场景分配一张图，最多5张，最少1张
3. 每张图描述要不同，覆盖文章的不同方面
4. 输出纯JSON对象

## 格式（必须是JSON对象，包含prompts数组）
{
  "prompts": [
    {"scene": "场景描述（如：车间师傅操作折弯机）", "prompt": "图像提示词"},
    {"scene": "另一场景描述", "prompt": "另一图像提示词"}
  ]
}

## 图像提示词规则
- 从文章中提取具体时间、人物动作、具体物件、环境细节、情绪氛围
- 手机/iPhone拍摄感，非专业构图，自然光
- 轻微过曝/暗角/噪点，随手拍
- 禁用：商业摄影、高清、8K、完美光影、高质感、精致、大片
- 纯中文描述，末尾 --ar 3:4
- 只输出JSON对象，不加任何其他文字

## 好例子
{"prompts":[{"scene":"车间师傅操作折弯机","prompt":"下午两点车间里闷热，穿灰色工装的中年师傅弯着腰在一台液压折弯机前仔细摸一块刚折好的铝板表面，手指上戴着白色工作手套，机器旁边的台面上堆着几张没折的铝板，车间从侧面窗户透进来的光线不均匀，地上有零散的铝屑，iPhone随手拍的车间日常 --ar 3:4"}]}`

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key") || ""
  if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 400 })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 })
  }

  const contentId = body.contentId
  if (!contentId) return NextResponse.json({ error: "缺少 contentId" }, { status: 400 })

  console.log("[image-prompts/batch] Generating for content:", contentId)

  const content = await prisma.content.findUnique({ where: { id: contentId } })
  if (!content) return NextResponse.json({ error: "内容不存在" }, { status: 404 })

  const title = content.title || "铝单板内容"
  const textBody = content.body || ""
  const contentType = content.contentType || "factory_real"

  console.log("[image-prompts/batch] type:", contentType, "title:", title.slice(0, 30))

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "XHS Content Tool",
    },
  })

  const models = parseModelsWithFallback(request.headers.get("x-models"))

  let rawJson = ""
  for (const m of models) {
    try {
      console.log("[image-prompts/batch] Trying model:", m)
      const result = await openai.chat.completions.create({
        model: m,
        messages: [
          { role: "system", content: IMAGE_PLAN_SYSTEM },
          { role: "user", content: `内容类型：${contentType}\n正文标题：${title}\n正文内容（仔细阅读，为每个场景生成配图）：${textBody.slice(0, 800)}` },
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      })
      rawJson = result.choices[0]?.message?.content || ""
      rawJson = rawJson.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      if (rawJson) break
    } catch (e: any) {
      console.log("[image-prompts/batch] Model", m, "failed:", e?.message?.slice(0, 100))
      if (e?.message?.includes("429") || e?.message?.includes("rate")) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }

  if (!rawJson) {
    return NextResponse.json({ error: "配图方案生成失败：所有模型均不可用" }, { status: 502 })
  }

  let prompts: Array<{ scene: string; prompt: string }> = []
  try {
    const parsed = JSON.parse(rawJson)
    if (Array.isArray(parsed)) {
      prompts = parsed
    } else if (parsed && typeof parsed === "object") {
      prompts = parsed.prompts || parsed.plans || parsed.images || []
    }
  } catch (e: any) {
    console.log("[image-prompts/batch] Failed to parse JSON, raw:", rawJson.slice(0, 500))
    console.log("[image-prompts/batch] Parse error:", e?.message)
    return NextResponse.json({ error: "配图方案解析失败：" + (e?.message || "非预期格式") + "\n原始返回：" + rawJson.slice(0, 300) }, { status: 502 })
  }

  if (prompts.length === 0) {
    return NextResponse.json({ error: "配图方案解析失败，AI 返回了非预期格式" }, { status: 502 })
  }

  await prisma.content.update({
    where: { id: contentId },
    data: { imagePrompts: JSON.stringify(prompts) },
  })

  console.log("[image-prompts/batch] Saved", prompts.length, "prompts to DB")

  return NextResponse.json({ prompts })
}
