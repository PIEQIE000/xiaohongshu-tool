import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || undefined

    const where: any = {}
    if (status) where.status = status

    const contents = await prisma.content.findMany({
      where,
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
    const { topicId, title, body, tags, contentType, publishHook, scheduledAt, status } = await request.json()
    const content = await prisma.content.create({
      data: {
        topicId: topicId || undefined,
        title: title || "",
        body: body || "",
        tags: tags || "",
        contentType: contentType || "knowledge",
        publishHook: publishHook || undefined,
        scheduledAt: scheduledAt || undefined,
        status: status || "draft",
      },
    })
    return NextResponse.json(content)
  } catch (err: any) {
    console.error("[content POST] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, title, body, tags, contentType, publishHook, scheduledAt, reviewScore, reviewFeedback, reviewedAt, imagePrompt, imagePrompts } = await request.json()
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 })

    const data: any = {}
    if (status !== undefined) data.status = status
    if (title !== undefined) data.title = title
    if (body !== undefined) data.body = body
    if (tags !== undefined) data.tags = tags
    if (contentType !== undefined) data.contentType = contentType
    if (publishHook !== undefined) data.publishHook = publishHook
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt
    if (reviewScore !== undefined) data.reviewScore = reviewScore
    if (reviewFeedback !== undefined) data.reviewFeedback = reviewFeedback
    if (reviewedAt !== undefined) data.reviewedAt = reviewedAt
    if (imagePrompt !== undefined) data.imagePrompt = imagePrompt
    if (imagePrompts !== undefined) data.imagePrompts = imagePrompts
    if (status === "published") data.publishedAt = new Date().toISOString()

    const content = await prisma.content.update({
      where: { id },
      data,
    })
    return NextResponse.json(content)
  } catch (err: any) {
    console.error("[content PATCH] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
