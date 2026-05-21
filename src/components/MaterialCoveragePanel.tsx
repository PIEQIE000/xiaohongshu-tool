"use client"

import { useEffect, useState } from "react"

type CoverageItem = { type: string; name: string; count: number; status: string }

interface CoveragePanelProps {
  onGenerateTasks: () => void
}

export function MaterialCoveragePanel({ onGenerateTasks }: CoveragePanelProps) {
  const [coverage, setCoverage] = useState<CoverageItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/assets/coverage")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCoverage(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-xs text-muted-foreground">加载中...</div>

  const emptyCount = coverage.filter((c) => c.status === "empty").length
  const lowCount = coverage.filter((c) => c.status === "low").length

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">素材覆盖率</h3>
        {(emptyCount > 0 || lowCount > 0) && (
          <button
            onClick={onGenerateTasks}
            className="text-xs text-violet-600 hover:underline"
          >
            {emptyCount} 个缺项 · 生成拍摄任务 →
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {coverage.map((item) => (
          <div key={item.type} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  item.status === "empty"
                    ? "bg-red-400"
                    : item.status === "low"
                    ? "bg-yellow-400"
                    : "bg-green-400"
                }`}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span
              className={`font-medium tabular-nums ${
                item.status === "empty"
                  ? "text-red-500"
                  : item.status === "low"
                  ? "text-yellow-600"
                  : "text-muted-foreground"
              }`}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}