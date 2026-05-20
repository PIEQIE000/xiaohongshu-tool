"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Trash2, Edit, PenLine } from "lucide-react"

type Topic = {
  id: string
  title: string
  tags: string
  status: string
  note: string
  createdAt: string
}

type ViewMode = "list" | "kanban"

const statusLabels: Record<string, string> = {
  pending: "待写",
  writing: "写作中",
  done: "已完成",
  published: "已发布",
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  writing: "bg-blue-50 text-blue-600",
  done: "bg-green-50 text-green-600",
  published: "bg-purple-50 text-purple-600",
}

export default function TopicsPage() {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [showCreate, setShowCreate] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formTags, setFormTags] = useState("")
  const [formNote, setFormNote] = useState("")

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set("status", filterStatus)
    const res = await fetch(`/api/topics?${params}`)
    const data = await res.json()
    setTopics(data)
  }

  const handleCreate = async () => {
    if (!formTitle.trim()) return
    await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formTitle, tags: formTags, note: formNote }),
    })
    setFormTitle("")
    setFormTags("")
    setFormNote("")
    setShowCreate(false)
    fetchTopics()
  }

  const handleUpdate = async (id: string, updates: Partial<Topic>) => {
    await fetch(`/api/topics/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    setEditingTopic(null)
    fetchTopics()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这个选题？")) return
    await fetch(`/api/topics/${id}`, { method: "DELETE" })
    fetchTopics()
  }

  const filteredTopics = topics.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.toLowerCase().includes(search.toLowerCase())
  )

  const columns = ["pending", "writing", "done", "published"]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">选题管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理你的内容选题和写作计划</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            列表
          </Button>
          <Button variant={viewMode === "kanban" ? "default" : "outline"} size="sm" onClick={() => setViewMode("kanban")}>
            看板
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> 新建选题
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索选题或标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); fetchTopics() }}
        >
          <option value="">全部状态</option>
          <option value="pending">待写</option>
          <option value="writing">写作中</option>
          <option value="done">已完成</option>
          <option value="published">已发布</option>
        </select>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-3">
          {filteredTopics.map((topic) => (
            <Card key={topic.id} className="hover:shadow-xl transition-all hover:-translate-y-0.5">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{topic.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[topic.status]}`}>
                      {statusLabels[topic.status]}
                    </span>
                  </div>
                  {topic.tags && (
                    <div className="flex gap-1 mt-1">
                      {topic.tags.split(",").filter(Boolean).map((tag, i) => (
                        <span key={i} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingTopic(topic)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/content?topic=${topic.id}&topicTitle=${encodeURIComponent(topic.title)}`)}>
                    <PenLine className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(topic.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredTopics.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              暂无选题，点击「新建选题」开始创作
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {columns.map((status) => (
            <div key={status} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  status === "pending" ? "bg-gray-400" :
                  status === "writing" ? "bg-blue-400" :
                  status === "done" ? "bg-green-400" : "bg-purple-400"
                }`} />
                {statusLabels[status]}
                <span className="text-xs font-normal">
                  ({filteredTopics.filter((t) => t.status === status).length})
                </span>
              </h3>
              <div className="space-y-2 min-h-[200px]">
                {filteredTopics
                  .filter((t) => t.status === status)
                  .map((topic) => (
                    <Card key={topic.id} className="hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer">
                      <CardContent className="py-3 px-4">
                        <p className="text-sm font-medium mb-1">{topic.title}</p>
                        {topic.tags && (
                          <div className="flex gap-1 flex-wrap">
                            {topic.tags.split(",").filter(Boolean).slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-xs bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-full">
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-1 mt-2">
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingTopic(topic)}>
                            编辑
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleDelete(topic.id)}>
                            删除
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[480px]">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">新建选题</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">标题</label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="输入选题标题" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">标签（逗号分隔）</label>
                  <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="如：铝单板,幕墙,装修" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">备注</label>
                  <Input value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="可选备注" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
                <Button onClick={handleCreate}>创建</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {editingTopic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[480px]">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">编辑选题</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">标题</label>
                  <Input
                    value={editingTopic.title}
                    onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">标签（逗号分隔）</label>
                  <Input
                    value={editingTopic.tags}
                    onChange={(e) => setEditingTopic({ ...editingTopic, tags: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">状态</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editingTopic.status}
                    onChange={(e) => setEditingTopic({ ...editingTopic, status: e.target.value })}
                  >
                    <option value="pending">待写</option>
                    <option value="writing">写作中</option>
                    <option value="done">已完成</option>
                    <option value="published">已发布</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">备注</label>
                  <Input
                    value={editingTopic.note}
                    onChange={(e) => setEditingTopic({ ...editingTopic, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditingTopic(null)}>取消</Button>
                <Button onClick={() => handleUpdate(editingTopic.id, editingTopic)}>保存</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
