import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const snippets = await prisma.materialSnippet.findMany({ orderBy: { updatedAt: "desc" } })
  return NextResponse.json(snippets)
}

export async function POST(request: Request) {
  const body = await request.json()
  const snippet = await prisma.materialSnippet.create({
    data: { type: body.type, title: body.title, content: body.content, tags: body.tags },
  })
  return NextResponse.json(snippet)
}
