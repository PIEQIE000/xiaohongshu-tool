import { NextResponse } from "next/server"
import OpenAI from "openai"
import { callOpenRouterWithFallback } from "@/lib/openrouter"

export async function POST(request: Request) {
  const { originalText, model } = await request.json()
  const apiKey = request.headers.get("x-api-key") || ""

  const models = parseModels(model)

  console.log("[enhance] models:", models)

  if (!apiKey) {
    return NextResponse.json({ error: "API Key 未配置" }, { status: 400 })
  }
  if (models.length === 0) {
    return NextResponse.json({ error: "请在设置中填写模型 ID" }, { status: 400 })
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "XHS Content Tool",
    },
  })

  const enhancePrompt = `请对以下小红书文案进行爆款升级：

原文案：
${originalText}

要求：
1. 在第二段插入"使用前后对比"的具象化描述
2. 增加1个权威背书要素
3. 将1个卖点改写为"反常识"表述
4. 检查所有表述是否符合广告法要求
5. 保持原意不变，只优化表达`

  try {
    const result = await callOpenRouterWithFallback(openai, models, enhancePrompt)
    console.log("[enhance] success:", result.model)
    return NextResponse.json({ content: result.content, model: result.model })
  } catch (err: any) {
    console.error("[enhance] ERROR:", err?.message || String(err))
    return NextResponse.json(
      { error: err?.message || "优化失败" },
      { status: 500 }
    )
  }
}

function parseModels(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(/[,，\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}