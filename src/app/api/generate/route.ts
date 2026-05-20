import { NextResponse } from "next/server"
import OpenAI from "openai"
import { callOpenRouterWithFallback } from "@/lib/openrouter"

export async function POST(request: Request) {
  const { prompt, model } = await request.json()
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

  try {
    const result = await callOpenRouterWithFallback(openai, models, prompt)
    console.log("[generate] success:", result.model)
    return NextResponse.json({ content: result.content, model: result.model })
  } catch (err: any) {
    console.error("[generate] ERROR:", err?.message || String(err))
    return NextResponse.json(
      { error: err?.message || "AI 生成失败" },
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