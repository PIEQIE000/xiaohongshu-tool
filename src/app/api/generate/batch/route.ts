import { NextResponse } from "next/server"

const typeRatio: Record<string, number> = {
  factory_real: 30,
  ai_render: 30,
  knowledge: 25,
  shipping: 15,
}

export async function POST(request: Request) {
  const { count = 3, model, scheduleDate } = await request.json()
  const apiKey = request.headers.get("x-api-key") || ""

  if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 400 })

  const types = Object.keys(typeRatio)
  const results: any[] = []
  const errors: string[] = []

  for (let i = 0; i < count; i++) {
    const contentType = types[i % types.length]
    try {
      const res = await fetch(`${request.url.replace("/batch", "/auto")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
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