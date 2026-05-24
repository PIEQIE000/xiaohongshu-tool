import { NextResponse } from "next/server"

const DEFAULT_RATIOS: Record<string, number> = {
  factory_real: 30,
  ai_render: 30,
  knowledge: 25,
  shipping: 15,
}

function pickContentType(ratios: Record<string, number>): string {
  const total = Object.values(ratios).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const [type, weight] of Object.entries(ratios)) {
    r -= weight
    if (r <= 0) return type
  }
  return Object.keys(ratios)[0]
}

export async function POST(request: Request) {
  const { count = 3, contentTypeRatios, model, scheduleDate } = await request.json()
  const apiKey = request.headers.get("x-api-key") || ""

  if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 400 })

  const ratios = contentTypeRatios && Object.keys(contentTypeRatios).length > 0 ? contentTypeRatios : DEFAULT_RATIOS
  const results: any[] = []
  const errors: string[] = []

  for (let i = 0; i < count; i++) {
    const contentType = pickContentType(ratios)
    try {
      const res = await fetch(`${request.url.replace("/batch", "/auto")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-models": request.headers.get("x-models") || "",
        },
        body: JSON.stringify({ contentType, model, scheduleDate }),
      })
      const data = await res.json()
      if (data.error) {
        errors.push(`${contentType}: ${data.error}`)
      } else {
        results.push({ contentType, ...data })
      }
    } catch (err: any) {
      errors.push(`${contentType}: ${err?.message}`)
    }
  }

  return NextResponse.json({ results, errors, total: count, success: results.length })
}