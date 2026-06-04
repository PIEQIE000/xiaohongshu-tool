import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/assets/share/[token] - 获取分享详情
export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params

  try {
    const link = await prisma.shareLink.findUnique({ where: { token } })
    if (!link) {
      return NextResponse.json({ error: "分享链接不存在或已失效" }, { status: 404 })
    }

    if (new Date() > new Date(link.expiresAt)) {
      return NextResponse.json({ error: "分享已过期" }, { status: 410 })
    }

    const assetIds = JSON.parse(link.assetIds) as string[]
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
    })

    // 增加浏览次数
    await prisma.shareLink.update({
      where: { id: link.id },
      data: { viewCount: link.viewCount + 1 },
    })

    return NextResponse.json({ assets })
  } catch (err: any) {
    console.error("[share] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
