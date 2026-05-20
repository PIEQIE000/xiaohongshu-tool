"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, Play } from "lucide-react"
import { builtInTemplates } from "@/data/prompt-templates"

type Template = { id: string; name: string; category: string; content: string; variables: string; isDefault: boolean }

export default function PromptTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(builtInTemplates.map((t) => ({
    id: t.id, name: t.name, category: t.category, content: t.content, variables: t.variables.join(","), isDefault: t.isDefault,
  })))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", category: "knowledge", content: "", variables: "" })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Prompt 模板</h1>
        <Button><Plus className="w-4 h-4 mr-1" /> 新建模板</Button>
      </div>

      <div className="space-y-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardContent className="py-4">
              {editingId === t.id ? (
                <div className="space-y-3">
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="模板名称" />
                  <textarea
                    className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    placeholder="Prompt 内容，使用 {变量名} 占位"
                  />
                  <Input value={editForm.variables} onChange={(e) => setEditForm({ ...editForm, variables: e.target.value })} placeholder="变量名（逗号分隔）" />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingId(null)}>取消</Button>
                    <Button onClick={() => setEditingId(null)}>保存</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      {t.isDefault && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">内置</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(t.id); setEditForm({ name: t.name, category: t.category, content: t.content, variables: t.variables }) }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                      {!t.isDefault && (
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.content.slice(0, 100)}...</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
