"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert } from "@/components/Alert"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Medal, BarChart3, Plus } from "lucide-react"

type MetricData = { id: string; date: string; likes: number; collects: number; comments: number; views: number; content?: { id: string; title: string; contentType: string } }
type ContentItem = { id: string; title: string; contentType: string; createdAt: string }
type AnalysisData = { typeAnalysis: any[]; top10: any[]; bottom10: any[]; timeAnalysis: any[]; total: number }

const typeLabels: Record<string, string> = {
  factory_real: "工厂实拍", ai_render: "AI效果图", knowledge: "干货科普", shipping: "发货展示",
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<MetricData[]>([])
  const [contents, setContents] = useState<ContentItem[]>([])
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [tab, setTab] = useState<"overview" | "ranking" | "type">("overview")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])
  const [formContentId, setFormContentId] = useState("")
  const [formLikes, setFormLikes] = useState(0)
  const [formCollects, setFormCollects] = useState(0)
  const [formComments, setFormComments] = useState(0)
  const [formViews, setFormViews] = useState(0)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchMetrics(); fetchContents(); fetchAnalysis() }, [])

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/metrics")
      const data = await res.json()
      if (Array.isArray(data)) setMetrics(data)
    } catch {}
  }

  const fetchContents = async () => {
    try {
      const res = await fetch("/api/content?limit=50")
      const data = await res.json()
      if (Array.isArray(data)) {
        setContents(data)
        if (data.length > 0 && !formContentId) setFormContentId(data[0].id)
      }
    } catch {}
  }

  const fetchAnalysis = async () => {
    try {
      const res = await fetch("/api/metrics/analysis")
      const data = await res.json()
      if (data.typeAnalysis) setAnalysis(data)
    } catch {}
  }

  const handleAdd = async () => {
    if (!formContentId) { setError("请选择一条已发布的内容"); return }
    setError("")
    try {
      await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: formContentId, likes: formLikes, collects: formCollects, comments: formComments, views: formViews, date: formDate }),
      })
      setFormLikes(0); setFormCollects(0); setFormComments(0); setFormViews(0)
      setShowForm(false)
      fetchMetrics()
      fetchAnalysis()
    } catch { setError("录入失败") }
  }

  const totalLikes = metrics.reduce((a, b) => a + b.likes, 0)
  const totalCollects = metrics.reduce((a, b) => a + b.collects, 0)
  const totalComments = metrics.reduce((a, b) => a + b.comments, 0)
  const totalViews = metrics.reduce((a, b) => a + b.views, 0)

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">数据复盘</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> 录入数据
        </Button>
      </div>

      <div className="flex gap-2 mb-4 md:mb-6">
        {[
          { key: "overview", label: "数据概览", icon: TrendingUp },
          { key: "ranking", label: "内容排名", icon: Medal },
          { key: "type", label: "类型分析", icon: BarChart3 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs md:text-sm transition-all ${
              tab === key ? "bg-violet-100 text-violet-700 font-medium" : "bg-gray-100 text-muted-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {error && <Alert message={error} />}

      {showForm && (
        <Card className="mb-4 md:mb-6 border-violet-200">
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold mb-3">录入数据</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">选择内容</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formContentId}
                  onChange={(e) => setFormContentId(e.target.value)}
                >
                  <option value="">请选择...</option>
                  {contents.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || "无标题"} ({typeLabels[c.contentType] || c.contentType})
                    </option>
                  ))}
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">日期</label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">点赞</label><Input type="number" value={formLikes} onChange={(e) => setFormLikes(Number(e.target.value))} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">收藏</label><Input type="number" value={formCollects} onChange={(e) => setFormCollects(Number(e.target.value))} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">评论</label><Input type="number" value={formComments} onChange={(e) => setFormComments(Number(e.target.value))} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">阅读</label><Input type="number" value={formViews} onChange={(e) => setFormViews(Number(e.target.value))} /></div>
            </div>
            <div className="flex gap-2 justify-end mt-3">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>取消</Button>
              <Button size="sm" onClick={handleAdd}>确认录入</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
            <Card><CardContent className="py-3 md:py-4 text-center"><p className="text-xs md:text-sm text-muted-foreground">总点赞</p><p className="text-2xl md:text-3xl font-bold text-red-500">{totalLikes}</p></CardContent></Card>
            <Card><CardContent className="py-3 md:py-4 text-center"><p className="text-xs md:text-sm text-muted-foreground">总收藏</p><p className="text-2xl md:text-3xl font-bold text-amber-500">{totalCollects}</p></CardContent></Card>
            <Card><CardContent className="py-3 md:py-4 text-center"><p className="text-xs md:text-sm text-muted-foreground">总评论</p><p className="text-2xl md:text-3xl font-bold text-blue-500">{totalComments}</p></CardContent></Card>
            <Card><CardContent className="py-3 md:py-4 text-center"><p className="text-xs md:text-sm text-muted-foreground">总阅读</p><p className="text-2xl md:text-3xl font-bold text-green-500">{totalViews}</p></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold mb-4">数据趋势</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="likes" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4 }} name="点赞" />
                    <Line type="monotone" dataKey="collects" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="收藏" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold mb-4">互动排行</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="likes" fill="#7C3AED" name="点赞" />
                    <Bar dataKey="collects" fill="#F59E0B" name="收藏" />
                    <Bar dataKey="comments" fill="#6366F1" name="评论" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {tab === "ranking" && analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold mb-3 text-green-600">Top 10 最佳表现</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-2 w-8">#</th>
                      <th className="pb-2 pr-2">标题</th>
                      <th className="pb-2 pr-2">类型</th>
                      <th className="pb-2 pr-2 text-right">互动率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.top10.map((item, i) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 pr-2 font-medium text-violet-600">{i + 1}</td>
                        <td className="py-2 pr-2 max-w-[120px] truncate">{item.title}</td>
                        <td className="py-2 pr-2"><span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{item.typeLabel}</span></td>
                        <td className="py-2 pr-2 text-right font-medium">{item.engagementRate}%</td>
                      </tr>
                    ))}
                    {analysis.top10.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">暂无数据</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold mb-3 text-red-500">Bottom 10 需优化</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-2 w-8">#</th>
                      <th className="pb-2 pr-2">标题</th>
                      <th className="pb-2 pr-2">类型</th>
                      <th className="pb-2 pr-2 text-right">互动率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.bottom10.map((item, i) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 pr-2 font-medium text-muted-foreground">{i + 1}</td>
                        <td className="py-2 pr-2 max-w-[120px] truncate">{item.title}</td>
                        <td className="py-2 pr-2"><span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{item.typeLabel}</span></td>
                        <td className="py-2 pr-2 text-right font-medium text-red-500">{item.engagementRate}%</td>
                      </tr>
                    ))}
                    {analysis.bottom10.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">暂无数据</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "type" && analysis && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold mb-4">按内容类型对比</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-2">内容类型</th>
                    <th className="pb-2 pr-2 text-right">发布数</th>
                    <th className="pb-2 pr-2 text-right">平均点赞</th>
                    <th className="pb-2 pr-2 text-right">平均收藏</th>
                    <th className="pb-2 pr-2 text-right">平均评论</th>
                    <th className="pb-2 pr-2 text-right">平均阅读</th>
                    <th className="pb-2 text-right">互动率</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.typeAnalysis.map((item) => (
                    <tr key={item.type} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-medium">{item.label}</td>
                      <td className="py-2 pr-2 text-right">{item.count}</td>
                      <td className="py-2 pr-2 text-right">{item.avgLikes}</td>
                      <td className="py-2 pr-2 text-right">{item.avgCollects}</td>
                      <td className="py-2 pr-2 text-right">{item.avgComments}</td>
                      <td className="py-2 pr-2 text-right">{item.avgViews}</td>
                      <td className="py-2 text-right">
                        <span className={`font-medium ${parseFloat(item.engagementRate) > 2 ? "text-green-600" : "text-muted-foreground"}`}>
                          {item.engagementRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {analysis.typeAnalysis.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">暂无数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}