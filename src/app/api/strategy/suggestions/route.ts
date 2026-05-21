import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const metrics = await prisma.metric.findMany({
      include: { content: true },
      orderBy: { date: "desc" },
    })

    const typeMap: Record<string, { totalLikes: number; totalCollects: number; totalComments: number; totalViews: number; count: number }> = {}
    const hourlyMap: Record<number, { likes: number; count: number }> = {}
    const tagMap: Record<string, { likes: number; count: number }> = {}
    const typeCounts: Record<string, number> = {}
    const totalMetrics = metrics.length

    for (const m of metrics) {
      const type = m.content?.contentType || "unknown"
      const tags = m.content?.tags || ""

      if (!typeMap[type]) typeMap[type] = { totalLikes: 0, totalCollects: 0, totalComments: 0, totalViews: 0, count: 0 }
      typeMap[type].totalLikes += m.likes
      typeMap[type].totalCollects += m.collects
      typeMap[type].totalComments += m.comments
      typeMap[type].totalViews += m.views
      typeMap[type].count++

      typeCounts[type] = (typeCounts[type] || 0) + 1

      if (m.content?.scheduledAt) {
        const hour = new Date(m.content.scheduledAt).getHours()
        if (!hourlyMap[hour]) hourlyMap[hour] = { likes: 0, count: 0 }
        hourlyMap[hour].likes += m.likes
        hourlyMap[hour].count++
      }

      if (tags) {
        tags.split(/[,，\s]+/).forEach((tag) => {
          const t = tag.trim()
          if (t && t.length > 1 && t !== "factory_real" && t !== "ai_render" && t !== "knowledge" && t !== "shipping") {
            if (!tagMap[t]) tagMap[t] = { likes: 0, count: 0 }
            tagMap[t].likes += m.likes
            tagMap[t].count++
          }
        })
      }
    }

    const typeRanking = Object.entries(typeMap)
      .map(([type, data]) => ({
        type,
        label: typeLabels[type] || type,
        avgLikes: Math.round(data.totalLikes / data.count),
        engagementRate: data.totalViews > 0
          ? ((data.totalLikes + data.totalCollects + data.totalComments) / data.totalViews * 100).toFixed(1)
          : "0.0",
        count: data.count,
        ratio: Math.round(data.count / totalMetrics * 100),
      }))
      .sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate))

    const hotTags = Object.entries(tagMap)
      .filter(([, data]) => data.count >= 2)
      .map(([tag, data]) => ({ tag, avgLikes: Math.round(data.likes / data.count), count: data.count }))
      .sort((a, b) => b.avgLikes - a.avgLikes)
      .slice(0, 5)

    const bestHours = Object.entries(hourlyMap)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        label: `${hour}:00`,
        avgLikes: Math.round(data.likes / data.count),
        count: data.count,
      }))
      .sort((a, b) => b.avgLikes - a.avgLikes)
      .slice(0, 3).map((h) => h.label)

    const fatiguedAssets = await prisma.asset.findMany({
      where: { isFatigued: true },
    })

    const assetCoverage = await prisma.asset.findMany({ where: { isFatigued: false } })
    const materialTypes = ["production_line", "spray_line", "raw_material", "finished_product", "packing_shipping", "detail_closeup", "color_swatch", "ai_render"]
    const lowCoverage = materialTypes
      .filter((t) => assetCoverage.filter((a) => a.type === t).length < 5)
      .map((t) => materialTypeLabels[t] || t)

    const highFatigue = materialTypes
      .filter((t) => fatiguedAssets.filter((a) => a.type === t).length >= 3)
      .map((t) => materialTypeLabels[t] || t)

    const suggestions = {
      typePerformance: typeRanking,
      topicRecommendations: hotTags,
      bestPublishHours: bestHours,
      materialLowCoverage: lowCoverage,
      materialHighFatigue: highFatigue,
      dataWarning: totalMetrics < 10 ? "数据积累中（当前仅 " + totalMetrics + " 条），分析结果仅供参考" : "",
    }

    return NextResponse.json(suggestions)
  } catch (err: any) {
    console.error("[strategy suggestions] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

const materialTypeLabels: Record<string, string> = {
  production_line: "生产线",
  spray_line: "喷涂线",
  raw_material: "原材料",
  finished_product: "成品",
  packing_shipping: "打包发货",
  detail_closeup: "细节特写",
  color_swatch: "色板",
  ai_render: "AI效果图",
}

const typeLabels: Record<string, string> = {
  factory_real: "工厂实拍",
  ai_render: "AI效果图",
  knowledge: "干货科普",
  shipping: "发货展示",
  unknown: "未知类型",
}