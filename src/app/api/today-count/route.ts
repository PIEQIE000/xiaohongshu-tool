import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const count = await prisma.content.count({
    where: {
      createdAt: { gte: todayStart },
      contentType: { in: ["factory_real", "ai_render", "knowledge", "shipping"] },
    },
  })

  return NextResponse.json({ count })
}
