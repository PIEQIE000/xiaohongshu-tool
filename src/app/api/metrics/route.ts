import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const metrics = await prisma.metric.findMany({ include: { content: true }, orderBy: { date: "desc" } })
  return NextResponse.json(metrics)
}

export async function POST(request: Request) {
  const body = await request.json()
  const metric = await prisma.metric.create({
    data: { contentId: body.contentId, likes: body.likes, collects: body.collects, comments: body.comments, views: body.views, date: body.date },
  })
  return NextResponse.json(metric)
}
