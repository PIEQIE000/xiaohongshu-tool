"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert } from "@/components/Alert"
import { TrendingUp, Lightbulb, Camera, Clock, Zap, BarChart3, AlertTriangle } from "lucide-react"

interface StrategyData {
  typePerformance: { type: string; label: string; avgLikes: number; engagementRate: string; count: number; ratio: number }[]
  topicRecommendations: { tag: string; avgLikes: number; count: number }[]
  bestPublishHours: string[]
  materialLowCoverage: string[]
  materialHighFatigue: string[]
  dataWarning: string
}

const typeLabels: Record<string, string> = {
  factory_real: "工厂实拍", ai_render: "AI效果图", knowledge: "干货科普", shipping: "发货展示",
}

export default function StrategyPage() {
  const [data, setData] = useState<StrategyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/strategy/suggestions")
      const d = await res.json()
      if (d.typePerformance) setData(d)
      else setError(d.error || "获取策略数据失败")
    } catch {
      setError("获取策略数据失败")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-4 md:p-6 text-muted-foreground">分析中...</div>

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">策略建议</h1>

      {error && <Alert message={error} />}

      {data?.dataWarning && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {data.dataWarning}
        </div>
      )}

      {data && (
        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-semibold">内容类型效果排名</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-2 w-8">#</th>
                      <th className="pb-2 pr-2">类型</th>
                      <th className="pb-2 pr-2 text-right">发布数</th>
                      <th className="pb-2 pr-2 text-right">占比</th>
                      <th className="pb-2 pr-2 text-right">平均点赞</th>
                      <th className="pb-2 text-right">互动率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.typePerformance.map((item, i) => (
                      <tr key={item.type} className="border-b last:border-0">
                        <td className="py-2 pr-2 font-medium">{i + 1}</td>
                        <td className="py-2 pr-2">{item.label}</td>
                        <td className="py-2 pr-2 text-right">{item.count}</td>
                        <td className="py-2 pr-2 text-right">{item.ratio}%</td>
                        <td className="py-2 pr-2 text-right">{item.avgLikes}</td>
                        <td className={`py-2 text-right font-medium ${parseFloat(item.engagementRate) > 2 ? "text-green-600" : ""}`}>
                          {item.engagementRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.typePerformance.length > 0 && (
                <div className="mt-3 p-3 bg-violet-50 rounded-lg text-sm text-violet-700">
                  <strong>建议：</strong>
                  互动率最高的「{data.typePerformance[0]?.label}」建议提高发布占比；
                  {data.typePerformance.length > 1 && (
                    <>「{data.typePerformance[data.typePerformance.length - 1]?.label}」互动率偏低，考虑优化内容方向或降低占比。</>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold">选题推荐</h3>
                </div>
                {data.topicRecommendations.length > 0 ? (
                  <div className="space-y-2">
                    {data.topicRecommendations.map((t) => (
                      <div key={t.tag} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="font-medium text-sm">#{t.tag}</span>
                        <span className="text-xs text-muted-foreground">
                          平均 {t.avgLikes} 赞 · {t.count} 篇
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">
                      以上标签互动较高，建议围绕这些方向策划新选题
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">数据积累中，暂无法推荐选题方向</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold">最佳发布时间</h3>
                </div>
                {data.bestPublishHours.length > 0 ? (
                  <div>
                    <div className="flex gap-2 mb-2">
                      {data.bestPublishHours.map((h) => (
                        <span key={h} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                          {h}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      以上时段发布的平均点赞最高，建议优先安排
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无发布时间数据，默认推荐 12:00 / 18:00 / 21:00</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold">素材缺口提醒</h3>
                </div>
                {data.materialLowCoverage.length > 0 ? (
                  <div>
                    <p className="text-sm mb-2">以下分类素材不足（少于5张）：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.materialLowCoverage.map((t) => (
                        <span key={t} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      建议优先补拍，避免影响自动生成内容质量
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-green-600">素材库覆盖完整</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold">素材疲劳提醒</h3>
                </div>
                {data.materialHighFatigue.length > 0 ? (
                  <div>
                    <p className="text-sm mb-2">以下分类大量素材已标记疲劳：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.materialHighFatigue.map((t) => (
                        <span key={t} className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      建议拍摄新素材或重置部分素材的疲劳标记
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无疲劳严重的分类</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-600" />
                  <h3 className="text-sm font-semibold">一键应用策略</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  将当前分析得出的内容配比建议同步到自动生成配置中
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const raw = localStorage.getItem("auto_gen_config")
                  let config: any = {}
                  if (raw) {
                    try { config = JSON.parse(raw) } catch {}
                  }

                  const ratios: Record<string, number> = config.contentTypeRatios || { factory_real: 30, ai_render: 30, knowledge: 25, shipping: 15 }

                  if (data.typePerformance.length >= 2) {
                    const sorted = [...data.typePerformance].sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate))
                    const best = sorted[0]
                    const worst = sorted[sorted.length - 1]
                    ratios[best.type] = Math.min(50, (ratios[best.type] || 25) + 10)
                    ratios[worst.type] = Math.max(5, (ratios[worst.type] || 25) - 10)
                  }

                  config.contentTypeRatios = ratios
                  localStorage.setItem("auto_gen_config", JSON.stringify(config))
                  alert("配比已更新到自动生成配置")
                }}
              >
                <Zap className="w-3.5 h-3.5 mr-1" /> 应用配比
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}