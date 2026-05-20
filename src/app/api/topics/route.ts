import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const tag = searchParams.get("tag")

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (tag) where.tags = { contains: tag }

  const topics = await prisma.topic.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(topics)
}

export async function POST(request: Request) {
  const body = await request.json()
  const topic = await prisma.topic.create({
    data: {
      title: body.title,
      tags: body.tags || "",
      status: body.status || "pending",
      note: body.note || "",
    },
  })
  return NextResponse.json(topic)
}
