import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const entries = await prisma.contentStrategy.findMany()
    const config: Record<string, any> = {}
    for (const entry of entries) {
      try { config[entry.key] = JSON.parse(entry.value) } catch { config[entry.key] = entry.value }
    }
    return NextResponse.json(config)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    for (const [key, value] of Object.entries(body)) {
      await prisma.contentStrategy.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}