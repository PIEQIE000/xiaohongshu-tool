"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type MetricData = { date: string; likes: number; collects: number; comments: number; views: number }

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<MetricData[]>([])
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])
  const [formLikes, setFormLikes] = useState(0)
  const [formCollects, setFormCollects] = useState(0)
  const [formComments, setFormComments] = useState(0)
  const [formViews, setFormViews] = useState(0)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    const res = await fetch("/api/metrics")
    const data = await res.json()
    setMetrics(data)
  }

  const handleAdd = async () => {
    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: "temp", likes: formLikes, collects: formCollects, comments: formComments, views: formViews, date: formDate }),
    })
    setFormLikes(0); setFormCollects(0); setFormComments(0); setFormViews(0)
    fetchMetrics()
  }

  const totalLikes = metrics.reduce((a, b) => a + b.likes, 0)
  const totalCollects = metrics.reduce((a, b) => a + b.collects, 0)
  const totalComments = metrics.reduce((a, b) => a + b.comments, 0)
  const totalViews = metrics.reduce((a, b) => a + b.views, 0)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">数据复盘</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="py-4 text-center"><p className="text-sm text-muted-foreground">总点赞</p><p className="text-3xl font-bold text-red-500">{totalLikes}</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-sm text-muted-foreground">总收藏</p><p className="text-3xl font-bold text-amber-500">{totalCollects}</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-sm text-muted-foreground">总评论</p><p className="text-3xl font-bold text-blue-500">{totalComments}</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-sm text-muted-foreground">总阅读</p><p className="text-3xl font-bold text-green-500">{totalViews}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
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

      <Card>
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold mb-4">录入数据</h3>
          <div className="grid grid-cols-6 gap-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">日期</label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">点赞</label><Input type="number" value={formLikes} onChange={(e) => setFormLikes(Number(e.target.value))} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">收藏</label><Input type="number" value={formCollects} onChange={(e) => setFormCollects(Number(e.target.value))} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">评论</label><Input type="number" value={formComments} onChange={(e) => setFormComments(Number(e.target.value))} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">阅读</label><Input type="number" value={formViews} onChange={(e) => setFormViews(Number(e.target.value))} /></div>
            <div className="flex items-end"><Button className="w-full" onClick={handleAdd}>录入</Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
