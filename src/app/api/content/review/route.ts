import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { parseModelsWithFallback } from "@/lib/model-try"

const REVIEW_PROMPT = `你是一个严格的小红书内容质量审核员，专为铝单板工厂账号审核内容。请根据以下5个维度对内容评分（满分100），并给出具体修改建议。

## 评分维度（每项0-20分）

1. **标题质量(0-20)**：标题是否包含具体信息点？是否避免了"厂家直销""价格优惠"等自夸词？是否有"情理之中，预料之外"的反差？

2. **角度/反差(0-20)**：内容的切入角度是否独特？是否避免了"所有人都会写的"第一直觉角度？有没有让读者觉得眼前一亮？

3. **故事性(0-20)**：是否有具体的场景、人物或真实经历？是用故事在讲，还是在列优势堆形容词？

4. **语言风格(0-20)**：读起来像工厂老板的真心话，还是像公关文案？是否避免了"我司""品质卓越"等官腔？

5. **红线检查(0-20)**：是否有虚假承诺？是否贬低具体同行？是否制造焦虑（"再不买就涨价"）？每条违规扣10分。

## 输出格式（JSON only，不要其他内容）
{
  "totalScore": 85,
  "titleScore": 16,
  "angleScore": 18,
  "storyScore": 17,
  "toneScore": 17,
  "redlineScore": 17,
  "verdict": "pass",
  "feedback": "整体质量好，标题可以更有反差感，建议加入一个具体数字。正文第2段的故事很生动。",
  "issues": ["标题缺少具体信息点，建议加入数据或对比", "第3段'品质卓越'改为具体参数更好"]
}

- totalScore: 五项总分
- verdict: "pass"(>=80分) | "warn"(60-79分，可放行但需关注) | "reject"(<60分，打回修改)
- feedback: 3-5句话的总体评价
- issues: 具体问题列表，每条一句话`

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key") || ""
  if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 400 })

  const body = await request.json()
  const contentId = body.contentId
  const title = body.title || ""
  const contentBody = body.body || ""
  const contentType = body.contentType || "factory_real"

  let reviewContent = ""
  let targetId = contentId

  if (contentId) {
    const content = await prisma.content.findUnique({ where: { id: contentId } })
    if (!content) return NextResponse.json({ error: "内容不存在" }, { status: 404 })
    reviewContent = `标题：${content.title || "无标题"}\n\n正文：${content.body || ""}`
  } else if (title || contentBody) {
    reviewContent = `标题：${title || "无标题"}\n\n正文：${contentBody || ""}`
  } else {
    return NextResponse.json({ error: "缺少 contentId 或 正文内容" }, { status: 400 })
  }

  const model = request.headers.get("x-model") || ""

  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "XHS Content Tool",
      },
    })

    const models = parseModelsWithFallback(request.headers.get("x-models"))
    let raw = ""

    for (const m of models) {
      try {
        const completion = await openai.chat.completions.create({
          model: model || m,
          messages: [
            { role: "system", content: REVIEW_PROMPT },
            { role: "user", content: `请审核以下内容：\n\n${reviewContent}` },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        })
        raw = completion.choices[0]?.message?.content || ""
        if (raw) break
      } catch (e: any) {
        console.log("[review] Model", m, "failed:", e?.message?.slice(0, 100))
        if (e?.message?.includes("429") || e?.message?.includes("rate")) {
          await new Promise(r => setTimeout(r, 2000))
        }
      }
    }

    if (!raw) return NextResponse.json({ error: "审核失败：所有模型均不可用" }, { status: 502 })

    let review: any
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      review = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: "AI 返回格式解析失败", raw }, { status: 500 })
    }

    if (targetId) {
      await prisma.content.update({
        where: { id: targetId },
        data: {
          reviewScore: review.totalScore,
          reviewFeedback: JSON.stringify(review),
          reviewedAt: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({
      ...review,
      contentId: targetId,
      reviewedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("[review] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message || "审核失败" }, { status: 500 })
  }
}