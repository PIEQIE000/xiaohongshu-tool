import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const asset = await prisma.asset.update({
      where: { id },
      data: {
        type: body.type,
        typeSource: body.typeSource,
        usageCount: body.usageCount,
        lastUsedAt: body.lastUsedAt ? new Date(body.lastUsedAt) : undefined,
        isFatigued: body.isFatigued,
      },
    })
    return NextResponse.json(asset)
  } catch (err: any) {
    console.error("[asset PUT] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}