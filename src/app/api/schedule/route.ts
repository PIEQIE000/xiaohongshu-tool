import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const entries = await prisma.calendarEntry.findMany({ include: { content: true }, orderBy: { date: "asc" } })
  return NextResponse.json(entries)
}

export async function POST(request: Request) {
  const body = await request.json()
  const entry = await prisma.calendarEntry.create({ data: { contentId: body.contentId, date: body.date, status: body.status } })
  return NextResponse.json(entry)
}
