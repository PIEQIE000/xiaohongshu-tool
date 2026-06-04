import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const materialTypes = [
  "production_line", "spray_line", "raw_material", "finished_product",
  "packing_shipping", "detail_closeup", "color_swatch", "ai_render",
  "construction",
]

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({ where: { isFatigued: false } })

    const typeNames: Record<string, string> = {
      production_line: "生产线",
      spray_line: "喷涂线",
      raw_material: "原材料",
      finished_product: "成品",
      packing_shipping: "打包发货",
      detail_closeup: "细节特写",
      color_swatch: "色板",
      ai_render: "AI效果图",
      construction: "现场施工安装",
    }

    const coverage = materialTypes.map((t) => {
      const count = assets.filter((a) => a.type === t).length
      let status = "ok"
      if (count === 0) status = "empty"
      else if (count < 5) status = "low"
      return { type: t, name: typeNames[t] || t, count, status }
    })

    return NextResponse.json(coverage)
  } catch (err: any) {
    console.error("[coverage] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}