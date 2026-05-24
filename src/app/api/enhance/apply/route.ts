import { NextResponse } from "next/server"
import OpenAI from "openai"
import { callOpenRouterWithFallback } from "@/lib/openrouter"
import { renderRulesForPrompt } from "@/data/content-rules"

export async function POST(request: Request) {
  const { originalText, reviewFeedback, reviewAdvice, model, contentType } = await request.json()
  const apiKey = request.headers.get("x-api-key") || ""

  const models = parseModels(model)

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

  let rulesSection = ""
  if (contentType) {
    rulesSection = renderRulesForPrompt(contentType)
  }

  const applyPrompt = `你是小红书文案编辑助手。请根据审核建议，对原文案做最小化修改。

原文案：
${originalText}

审核反馈：
${reviewAdvice || ""}
${reviewFeedback ? "\n待改进项：\n" + reviewFeedback.split("\n").map((line: string, i: number) => `${i + 1}. ${line}`).join("\n") : ""}

修改要求（严格遵守）：
1. 只针对上面列出的每条待改进项做针对性修改，不要改写其他地方
2. 如果是标题问题，重新写标题（保持原标题风格，只加入建议中要求的具体信息或反差）
3. 如果是正文问题，在正文合适位置插入建议要求的内容（如具体数据、案例等），不要删改原文
4. 输出格式必须包含两部分：
   第一行：【新标题】+ 标题内容
   之后空一行：【正文】+ 修改后的正文
5. 只输出上述两部分，不要加其他解释

${rulesSection}`

  try {
    const result = await callOpenRouterWithFallback(openai, models, applyPrompt)
    console.log("[apply] success:", result.model)
    return NextResponse.json({ content: result.content, model: result.model })
  } catch (err: any) {
    console.error("[apply] ERROR:", err?.message || String(err))
    return NextResponse.json(
      { error: err?.message || "应用建议失败" },
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
