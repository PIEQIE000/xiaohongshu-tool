import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const materialTypes = [
  "production_line", "spray_line", "raw_material", "finished_product",
  "packing_shipping", "detail_closeup", "color_swatch", "ai_render",
]

const typeNames: Record<string, string> = {
  production_line: "生产线",
  spray_line: "喷涂线",
  raw_material: "原材料",
  finished_product: "成品",
  packing_shipping: "打包发货",
  detail_closeup: "细节特写",
  color_swatch: "色板",
  ai_render: "AI效果图",
}

export async function POST() {
  try {
    const assets = await prisma.asset.findMany({ where: { isFatigued: false } })
    const existingTasks = await prisma.materialTask.findMany({ where: { status: "pending" } })

    const generated: string[] = []
    const skipped: string[] = []

    for (const t of materialTypes) {
      const count = assets.filter((a) => a.type === t).length
      if (count >= 5) continue

      const alreadyHasTask = existingTasks.some((task) =>
        task.requiredTypes.split(",").map((s) => s.trim()).includes(t)
      )
      if (alreadyHasTask) {
        skipped.push(typeNames[t] || t)
        continue
      }

      const needed = 5 - count
      await prisma.materialTask.create({
        data: {
          title: `补拍${typeNames[t] || t}素材 ${needed} 张`,
          description: `${typeNames[t] || t}分类当前仅有 ${count} 张素材，需要补充 ${needed} 张`,
          requiredTypes: t,
          requiredCount: needed,
        },
      })
      generated.push(typeNames[t] || t)
    }

    return NextResponse.json({ generated, skipped })
  } catch (err: any) {
    console.error("[tasks generate] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}