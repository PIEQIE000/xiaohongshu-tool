import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(assets)
}

export async function POST(request: Request) {
  const body = await request.json()
  const asset = await prisma.asset.create({ data: { type: body.type, url: body.url, title: body.title, tags: body.tags } })
  return NextResponse.json(asset)
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  await prisma.asset.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
