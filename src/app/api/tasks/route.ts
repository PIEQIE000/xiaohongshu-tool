import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (status && status !== "all") {
      where.status = status
    }

    const tasks = await prisma.materialTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(tasks)
  } catch (err: any) {
    console.error("[tasks GET] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const task = await prisma.materialTask.create({
      data: {
        title: body.title,
        description: body.description || "",
        requiredTypes: body.requiredTypes || "",
        requiredCount: body.requiredCount || 5,
        dueDate: body.dueDate || null,
      },
    })
    return NextResponse.json(task)
  } catch (err: any) {
    console.error("[tasks POST] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}