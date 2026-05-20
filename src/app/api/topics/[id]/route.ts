import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const topic = await prisma.topic.update({
    where: { id },
    data: {
      title: body.title,
      tags: body.tags,
      status: body.status,
      note: body.note,
    },
  })
  return NextResponse.json(topic)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.topic.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
