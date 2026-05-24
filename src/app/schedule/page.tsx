"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Link2, FileText } from "lucide-react"

type CalendarEntry = { id: string; contentId: string; date: string; status: string; content: { id: string; title: string; body: string } }

export default function SchedulePage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<CalendarEntry[]>([])

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    const res = await fetch("/api/schedule")
    const data = await res.json()
    setEntries(data)
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"]

  const getEntriesForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return entries.filter((e) => e.date === dateStr)
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const handleClickEntry = (entry: CalendarEntry) => {
    localStorage.setItem("current_generated_text", entry.content.body)
    localStorage.setItem("current_content_title", entry.content.title)
    router.push("/content")
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">排期日历</h1>
        <Button variant="outline" onClick={() => {}}>
          <Link2 className="w-4 h-4 mr-1" /> 跳转小红书发布
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>暂无排期内容</p>
            <p className="text-xs mt-1">在内容创作页点击「排期」按钮添加</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold">
                {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
              </span>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[50px] md:min-h-[80px]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEntries = getEntriesForDay(day)
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth()
                return (
                  <div
                    key={day}
                    className={`min-h-[60px] md:min-h-[80px] border rounded-lg p-1 ${
                      isToday ? "border-violet-300 bg-violet-50" : "border-border"
                    }`}
                  >
                    <span className={`text-xs ${isToday ? "text-violet-600 font-bold" : "text-muted-foreground"}`}>{day}</span>
                    {dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="mt-1 text-xs bg-violet-100 text-violet-700 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-violet-200 transition-colors"
                        onClick={() => handleClickEntry(entry)}
                        title="点击查看内容"
                      >
                        {entry.content?.title || "未命名内容"}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
