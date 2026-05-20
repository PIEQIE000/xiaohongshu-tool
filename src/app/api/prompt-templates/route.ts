import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const templates = await prisma.promptTemplate.findMany({ orderBy: { isDefault: "desc" } })
  return NextResponse.json(templates)
}

export async function POST(request: Request) {
  const body = await request.json()
  const template = await prisma.promptTemplate.create({
    data: { name: body.name, category: body.category, content: body.content, variables: body.variables },
  })
  return NextResponse.json(template)
}

export async function PUT(request: Request) {
  const { id, ...body } = await request.json()
  const template = await prisma.promptTemplate.update({ where: { id }, data: { name: body.name, category: body.category, content: body.content, variables: body.variables } })
  return NextResponse.json(template)
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  await prisma.promptTemplate.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
