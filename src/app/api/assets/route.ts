import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const materialTypes = [
  "production_line", "spray_line", "raw_material", "finished_product",
  "packing_shipping", "detail_closeup", "color_swatch", "ai_render",
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || ""
    const showFatigued = searchParams.get("fatigue") === "true"

    const where: any = {}
    if (category && materialTypes.includes(category)) {
      where.type = category
    }
    if (!showFatigued) {
      where.isFatigued = false
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(assets)
  } catch (err: any) {
    console.error("[assets GET] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const asset = await prisma.asset.create({
      data: {
        type: body.type || "finished_product",
        url: body.url,
        title: body.title || "",
        tags: body.tags || "",
      },
    })
    return NextResponse.json(asset)
  } catch (err: any) {
    console.error("[assets POST] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await prisma.asset.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error("[assets DELETE] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}