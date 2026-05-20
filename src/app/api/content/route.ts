import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const contents = await prisma.content.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    return NextResponse.json(contents)
  } catch (err: any) {
    console.error("[content GET] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { topicId, title, body, tags } = await request.json()
    const content = await prisma.content.create({
      data: {
        topicId: topicId || undefined,
        title: title || "",
        body: body || "",
        tags: tags || "",
      },
    })
    return NextResponse.json(content)
  } catch (err: any) {
    console.error("[content POST] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
