"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/Alert"
import { Plus, CheckCircle, Clock, Trash2, Upload, Sparkles } from "lucide-react"

interface MaterialTask {
  id: string
  title: string
  description: string
  requiredTypes: string
  requiredCount: number
  status: string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<MaterialTask[]>([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newTypes, setNewTypes] = useState("")
  const [newCount, setNewCount] = useState(5)
  const [error, setError] = useState("")
  const [generatingMsg, setGeneratingMsg] = useState("")

  const fetchTasks = async () => {
    try {
      const url = filterStatus === "all" ? "/api/tasks" : `/api/tasks?status=${filterStatus}`
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data)) setTasks(data)
    } catch {
      setError("获取任务列表失败")
    }
  }

  useEffect(() => { fetchTasks() }, [filterStatus])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          requiredTypes: newTypes,
          requiredCount: newCount,
        }),
      })
      setNewTitle("")
      setNewDesc("")
      setNewTypes("")
      setNewCount(5)
      setShowCreate(false)
      fetchTasks()
    } catch {
      setError("创建任务失败")
    }
  }

  const handleToggleStatus = async (task: MaterialTask) => {
    const newStatus = task.status === "done" ? "pending" : "done"
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTasks()
    } catch {
      setError("更新任务状态失败")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" })
      fetchTasks()
    } catch {
      setError("删除任务失败")
    }
  }

  const handleGenerate = async () => {
    setGeneratingMsg("正在分析素材库覆盖率...")
    setError("")
    try {
      const res = await fetch("/api/tasks/generate", { method: "POST" })
      const data = await res.json()
      if (data.generated?.length > 0) {
        setGeneratingMsg(`已生成 ${data.generated.length} 个任务：${data.generated.join("、")}`)
      } else {
        setGeneratingMsg("素材库覆盖完整，无需生成新任务")
      }
      if (data.skipped?.length > 0) {
        setGeneratingMsg((prev) => prev + `（跳过：${data.skipped.join("、")}，已有待完成任务）`)
      }
      fetchTasks()
    } catch {
      setError("生成任务失败")
    }
  }

  const pendingCount = tasks.filter((t) => t.status === "pending").length
  const doneCount = tasks.filter((t) => t.status === "done").length

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">拍摄任务</h1>
          <p className="text-sm text-muted-foreground mt-1">
            待完成 {pendingCount} 项，已完成 {doneCount} 项
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleGenerate}>
            <Sparkles className="w-4 h-4 mr-1" /> 自动生成任务
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> 新建任务
          </Button>
        </div>
      </div>

      {generatingMsg && (
        <div className="mb-4 p-3 bg-violet-50 text-violet-700 rounded-lg text-sm">{generatingMsg}</div>
      )}
      {error && <Alert message={error} />}

      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4">
        {["all", "pending", "done"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-md text-sm transition-all ${
              filterStatus === s ? "bg-violet-100 text-violet-700 font-medium" : "bg-gray-100 text-muted-foreground"
            }`}
          >
            {s === "all" ? "全部" : s === "pending" ? "待完成" : "已完成"}
          </button>
        ))}
      </div>

      {showCreate && (
        <Card className="mb-4 border-violet-200">
          <CardContent className="py-4 space-y-3">
            <h3 className="text-sm font-semibold">新建拍摄任务</h3>
            <Input placeholder="任务标题" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Input placeholder="详细说明" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <Input placeholder="素材类型（逗号分隔）" value={newTypes} onChange={(e) => setNewTypes(e.target.value)} />
            <Input type="number" min={1} placeholder="需要数量" value={newCount} onChange={(e) => setNewCount(parseInt(e.target.value) || 5)} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>取消</Button>
              <Button size="sm" onClick={handleCreate}>创建</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {tasks.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>暂无拍摄任务</p>
            <p className="text-sm mt-1">点击「自动生成任务」或「新建任务」添加</p>
          </div>
        )}
        {tasks.map((task) => (
          <Card key={task.id} className={task.status === "done" ? "opacity-60" : ""}>
            <CardContent className="py-3 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {task.status === "done" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  <span className={`text-sm font-medium ${task.status === "done" ? "line-through" : ""}`}>
                    {task.title}
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 ml-6">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 ml-6">
                  {task.requiredTypes && (
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {task.requiredTypes}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    需要 {task.requiredCount} 张
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      截止: {task.dueDate}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-3">
                {task.status === "done" ? (
                  <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(task)} className="text-xs">
                    撤销
                  </Button>
                ) : (
                  <>
                    <Link href="/materials">
                      <Button variant="ghost" size="sm" className="text-xs text-violet-600">
                        <Upload className="w-3 h-3 mr-1" /> 去上传
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(task)} className="text-xs">
                      完成
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)} className="text-xs text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}