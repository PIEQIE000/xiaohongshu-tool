import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

// POST /api/assets/share - 创建分享链接
export async function POST(request: Request) {
  const { assetIds } = await request.json()
  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    return NextResponse.json({ error: "请至少选择一张图片" }, { status: 400 })
  }

  try {
    const token = randomBytes(8).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 小时

    const link = await prisma.shareLink.create({
      data: {
        token,
        assetIds: JSON.stringify(assetIds),
        expiresAt,
      },
    })

    return NextResponse.json({ token, expiresAt: expiresAt.toISOString() })
  } catch (err: any) {
    console.error("[share] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
