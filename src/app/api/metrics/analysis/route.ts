import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const metrics = await prisma.metric.findMany({
      include: { content: true },
      orderBy: { date: "desc" },
    })

    const typeAgg: Record<string, { totalLikes: number; totalCollects: number; totalComments: number; totalViews: number; count: number }> = {}
    const contentMap: Record<string, { title: string; type: string; likes: number; collects: number; comments: number; views: number }> = {}
    const hourlyAgg: Record<number, { likes: number; views: number; count: number }> = {}

    for (const m of metrics) {
      const type = m.content?.contentType || "unknown"
      const title = m.content?.title || "未知内容"
      const contentId = m.contentId

      if (!typeAgg[type]) {
        typeAgg[type] = { totalLikes: 0, totalCollects: 0, totalComments: 0, totalViews: 0, count: 0 }
      }
      typeAgg[type].totalLikes += m.likes
      typeAgg[type].totalCollects += m.collects
      typeAgg[type].totalComments += m.comments
      typeAgg[type].totalViews += m.views
      typeAgg[type].count++

      if (!contentMap[contentId]) {
        contentMap[contentId] = { title, type, likes: 0, collects: 0, comments: 0, views: 0 }
      }
      contentMap[contentId].likes += m.likes
      contentMap[contentId].collects += m.collects
      contentMap[contentId].comments += m.comments
      contentMap[contentId].views += m.views

      if (m.content?.scheduledAt) {
        const hour = new Date(m.content.scheduledAt).getHours()
        if (!hourlyAgg[hour]) hourlyAgg[hour] = { likes: 0, views: 0, count: 0 }
        hourlyAgg[hour].likes += m.likes
        hourlyAgg[hour].views += m.views
        hourlyAgg[hour].count++
      }
    }

    const typeAnalysis = Object.entries(typeAgg).map(([type, data]) => ({
      type,
      label: typeLabels[type] || type,
      avgLikes: Math.round(data.totalLikes / data.count),
      avgCollects: Math.round(data.totalCollects / data.count),
      avgComments: Math.round(data.totalComments / data.count),
      avgViews: Math.round(data.totalViews / data.count),
      engagementRate: data.totalViews > 0
        ? ((data.totalLikes + data.totalCollects + data.totalComments) / data.totalViews * 100).toFixed(1)
        : "0.0",
      count: data.count,
    })).sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate))

    const rankings = Object.entries(contentMap)
      .map(([id, data]) => ({
        id,
        title: data.title,
        type: data.type,
        typeLabel: typeLabels[data.type] || data.type,
        likes: data.likes,
        collects: data.collects,
        comments: data.comments,
        views: data.views,
        engagementRate: data.views > 0
          ? ((data.likes + data.collects + data.comments) / data.views * 100).toFixed(1)
          : "0.0",
      }))
      .sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate))

    const top10 = rankings.slice(-10).reverse()
    const bottom10 = rankings.slice(0, 10)

    const timeAnalysis = Object.entries(hourlyAgg)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        label: `${hour}:00`,
        avgEngagement: data.count > 0
          ? (data.likes / data.count).toFixed(1)
          : "0",
        count: data.count,
      }))
      .sort((a, b) => a.hour - b.hour)

    return NextResponse.json({ typeAnalysis, top10, bottom10, timeAnalysis, total: metrics.length })
  } catch (err: any) {
    console.error("[metrics analysis] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

const typeLabels: Record<string, string> = {
  factory_real: "工厂实拍",
  ai_render: "AI效果图",
  knowledge: "干货科普",
  shipping: "发货展示",
  unknown: "未知类型",
}