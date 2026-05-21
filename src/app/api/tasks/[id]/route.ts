import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const task = await prisma.materialTask.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        requiredTypes: body.requiredTypes,
        requiredCount: body.requiredCount,
        status: body.status,
        dueDate: body.dueDate,
        completedAt: body.status === "done" ? new Date() : body.completedAt,
      },
    })
    return NextResponse.json(task)
  } catch (err: any) {
    console.error("[task PUT] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.materialTask.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[task DELETE] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}