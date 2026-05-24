import { NextResponse } from "next/server"
import OpenAI from "openai"
import { callOpenRouterWithFallback } from "@/lib/openrouter"
import { getKnowledgeByContentType, renderKnowledgeContent } from "@/data/industry-knowledge"
import { renderRulesForPrompt } from "@/data/content-rules"

export async function POST(request: Request) {
  const { originalText, reviewFeedback, reviewAdvice, model, contentType } = await request.json()
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

  const hasReview = reviewFeedback || reviewAdvice
  const reviewSection = hasReview ? `

## AI 审核发现的问题（必须逐条修复）
${reviewAdvice || ""}
${reviewFeedback ? "\n待改进项：\n" + reviewFeedback.split("\n").map((line: string, i: number) => `${i + 1}. ${line}`).join("\n") : ""}

**修复要求**：
- 必须保留原文案的核心信息和风格
- 针对上面每一条问题，在对应位置做针对性修改
- 标题问题 → 重写标题，加入具体信息点或反差
- 角度问题 → 调整开头切入点，制造陌生感
- 故事性问题 → 增加具体场景、人物、数字
- 语气问题 → 调整用词，更像真人说话
- 红线问题 → 删除违规表述
` : ""

  // 注入行业知识
  let knowledgeSection = ""
  if (contentType) {
    const modules = getKnowledgeByContentType(contentType)
    if (modules.length > 0) {
      knowledgeSection = renderKnowledgeContent(modules.map(m => m.id))
    }
  }

  // 注入内容规则
  let rulesSection = ""
  if (contentType) {
    rulesSection = renderRulesForPrompt(contentType)
  }

  const enhancePrompt = `你是小红书爆款文案编辑。请对以下文案进行优化${hasReview ? "，严格按照审核反馈逐条修复" : ""}。

原文案：
${originalText}${reviewSection}${knowledgeSection}${rulesSection}

要求：
1. 只输出优化后的完整文案，不要解释
2. 保持原文案的核心信息不变${hasReview ? "，必须解决上面列出的所有问题" : ""}
3. 如果是标题问题，重新构思一个有反差感和具体信息点的标题
4. 保持250-350字的正文长度`

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