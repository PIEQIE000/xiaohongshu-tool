"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BookOpen, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Check, X, Lightbulb } from "lucide-react"
import { industryKnowledge, type KnowledgeModule } from "@/data/industry-knowledge"
import { getAllRules, type ContentRule } from "@/data/content-rules"

// 存储用户修改和新增的模块
const STORAGE_KEY = "knowledge_modules"
// 存储用户修改的内容规则
const RULES_STORAGE_KEY = "content_rules_overrides"

function getOverrides(): Record<string, Partial<KnowledgeModule>> {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

function setOverrides(data: Record<string, Partial<KnowledgeModule>>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getRulesOverrides(): Record<string, Partial<ContentRule>> {
  const raw = localStorage.getItem(RULES_STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

function setRulesOverrides(data: Record<string, Partial<ContentRule>>) {
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(data))
}

function mergeRulesWithOverrides(): ContentRule[] {
  const overrides = getRulesOverrides()
  const builtIn = getAllRules()
  return builtIn.map(r => {
    const ov = overrides[r.id]
    return ov ? { ...r, ...ov } as ContentRule : r
  })
}

function mergeModules(): KnowledgeModule[] {
  const overrides = getOverrides()
  const overrideIds = new Set(Object.keys(overrides))
  const builtIn = industryKnowledge.filter(m => !overrideIds.has(m.id)).map(m => {
    const ov = overrides[m.id]
    return ov ? { ...m, ...ov } as KnowledgeModule : m
  })
  const custom: KnowledgeModule[] = Object.entries(overrides)
    .filter(([id]) => !industryKnowledge.find(m => m.id === id))
    .map(([id, ov]) => ({
      id,
      name: ov.name || id,
      description: ov.description || "",
      content: ov.content || "",
      tags: ov.tags || [],
    }))
  return [...builtIn, ...custom]
}

export default function KnowledgePage() {
  const [modules, setModules] = useState<KnowledgeModule[]>([])
  const [rules, setRules] = useState<ContentRule[]>([])
  const [activeTab, setActiveTab] = useState<"knowledge" | "rules">("knowledge")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", description: "", content: "", tags: "" })
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ id: "", name: "", description: "", content: "", tags: "" })
  const [savedId, setSavedId] = useState<string | null>(null)
  // 规则编辑状态
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [ruleEditForm, setRuleEditForm] = useState({ name: "", description: "", instruction: "", enabled: true, category: "" })
  const [ruleSavedId, setRuleSavedId] = useState<string | null>(null)

  useEffect(() => {
    setModules(mergeModules())
    setRules(mergeRulesWithOverrides())
  }, [])

  const refreshModules = () => setModules(mergeModules())
  const refreshRules = () => setRules(mergeRulesWithOverrides())

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setEditingId(null)
  }

  const startEdit = (m: KnowledgeModule) => {
    setEditingId(m.id)
    setExpandedId(m.id)
    setEditForm({
      name: m.name,
      description: m.description,
      content: m.content,
      tags: m.tags.join(", "),
    })
  }

  const saveEdit = () => {
    if (!editingId) return
    const overrides = getOverrides()
    overrides[editingId] = {
      name: editForm.name,
      description: editForm.description,
      content: editForm.content,
      tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean),
    }
    setOverrides(overrides)
    setSavedId(editingId)
    setTimeout(() => setSavedId(null), 2000)
    setEditingId(null)
    refreshModules()
  }

  const addNewModule = () => {
    if (!newForm.id || !newForm.name) return
    const overrides = getOverrides()
    if (overrides[newForm.id] !== undefined || industryKnowledge.find(m => m.id === newForm.id)) {
      alert("模块 ID 已存在，请使用其他 ID")
      return
    }
    overrides[newForm.id] = {
      id: newForm.id,
      name: newForm.name,
      description: newForm.description,
      content: newForm.content,
      tags: newForm.tags.split(",").map(t => t.trim()).filter(Boolean),
    }
    setOverrides(overrides)
    setSavedId(newForm.id)
    setTimeout(() => setSavedId(null), 2000)
    setShowNew(false)
    setNewForm({ id: "", name: "", description: "", content: "", tags: "" })
    refreshModules()
  }

  const deleteModule = (id: string) => {
    const isBuiltIn = industryKnowledge.find(m => m.id === id) !== undefined
    if (!confirm(isBuiltIn ? "恢复为内置默认值？" : "删除此模块？")) return
    const overrides = getOverrides()
    delete overrides[id]
    setOverrides(overrides)
    setEditingId(null)
    setExpandedId(null)
    refreshModules()
  }

  const isBuiltin = (id: string) => industryKnowledge.find(m => m.id === id) !== undefined

  // 规则编辑
  const startEditRule = (r: ContentRule) => {
    setEditingRuleId(r.id)
    setRuleEditForm({
      name: r.name,
      description: r.description,
      instruction: r.instruction,
      enabled: r.enabled,
      category: r.category,
    })
  }

  const saveRuleEdit = () => {
    if (!editingRuleId) return
    const overrides = getRulesOverrides()
    overrides[editingRuleId] = {
      name: ruleEditForm.name,
      description: ruleEditForm.description,
      instruction: ruleEditForm.instruction,
      enabled: ruleEditForm.enabled,
      category: ruleEditForm.category as ContentRule["category"],
    }
    setRulesOverrides(overrides)
    setRuleSavedId(editingRuleId)
    setTimeout(() => setRuleSavedId(null), 2000)
    setEditingRuleId(null)
    refreshRules()
  }

  const toggleRuleEnabled = (id: string) => {
    const overrides = getRulesOverrides()
    const rule = rules.find(r => r.id === id)
    if (!rule) return
    overrides[id] = { ...rule, enabled: !rule.enabled }
    setRulesOverrides(overrides)
    refreshRules()
  }

  const resetRule = (id: string) => {
    if (!confirm("重置此规则为默认值？")) return
    const overrides = getRulesOverrides()
    delete overrides[id]
    setRulesOverrides(overrides)
    setEditingRuleId(null)
    refreshRules()
  }

  const categoryLabels: Record<string, string> = {
    structure: "结构规则",
    audience: "受众规则",
    material: "素材规则",
    hook: "话术规则",
  }

  const categoryColors: Record<string, string> = {
    structure: "bg-blue-50 text-blue-600",
    audience: "bg-purple-50 text-purple-600",
    material: "bg-orange-50 text-orange-600",
    hook: "bg-green-50 text-green-600",
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {activeTab === "knowledge" ? (
            <BookOpen className="w-6 h-6 text-violet-600" />
          ) : (
            <Lightbulb className="w-6 h-6 text-violet-600" />
          )}
          <h1 className="text-xl md:text-2xl font-bold">
            {activeTab === "knowledge" ? "行业知识库" : "内容规则"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "knowledge" ? "default" : "outline"}
            size="sm"
            onClick={() => { setActiveTab("knowledge"); setEditingRuleId(null); }}
          >
            <BookOpen className="w-4 h-4 mr-1" /> 行业知识
          </Button>
          <Button
            variant={activeTab === "rules" ? "default" : "outline"}
            size="sm"
            onClick={() => { setActiveTab("rules"); setEditingId(null); }}
          >
            <Lightbulb className="w-4 h-4 mr-1" /> 内容规则 ({rules.filter(r => r.enabled).length}/{rules.length})
          </Button>
        </div>
      </div>

      {activeTab === "knowledge" && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            知识库为 AI 生成提供真实的行业数据参考。修改即时生效，可用于积累和管理行业知识。
            内置模块可编辑覆盖，自定义模块可随时新增或删除。
          </p>

          {showNew && (
            <Card className="mb-4 border-violet-200 bg-violet-50/30">
              <CardContent className="py-4 space-y-3">
                <h3 className="text-sm font-semibold">新增知识模块</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">模块 ID（英文，唯一）*</label>
                    <Input placeholder="例如：installation-guide" value={newForm.id} onChange={e => setNewForm({ ...newForm, id: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">模块名称*</label>
                    <Input placeholder="例如：铝单板安装施工规范" value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">描述</label>
                  <Input placeholder="一句话描述这个模块的内容" value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">标签（逗号分隔，用于内容类型匹配）</label>
                  <Input placeholder="knowledge, faq, auto-factory, visual, auto-shipping" value={newForm.tags} onChange={e => setNewForm({ ...newForm, tags: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">匹配规则：knowledge→知识科普，visual→视觉展示，auto-factory→工厂实拍，auto-shipping→发货展示</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">知识内容（Markdown 格式）</label>
                  <textarea
                    className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="使用 Markdown 格式编写知识内容..."
                    value={newForm.content}
                    onChange={e => setNewForm({ ...newForm, content: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addNewModule} disabled={!newForm.id || !newForm.name}>
                    <Check className="w-4 h-4 mr-1" />保存
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setShowNew(false); setNewForm({ id: "", name: "", description: "", content: "", tags: "" }) }}>
                    <X className="w-4 h-4 mr-1" />取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {modules.map(m => {
              const isExpanded = expandedId === m.id
              const isEditing = editingId === m.id
              const isSaved = savedId === m.id
              const builtIn = isBuiltin(m.id)

              return (
                <Card key={m.id} className={isEditing ? "border-violet-300" : isSaved ? "border-green-300" : ""}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => toggleExpand(m.id)} className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronUp className="w-4 h-4 shrink-0" />}
                          <span className="font-medium text-sm">{m.name}</span>
                          {!builtIn && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">自定义</span>}
                          {isSaved && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {isExpanded && !isEditing && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEdit(m)}>
                            <Edit2 className="w-3 h-3 mr-1" />编辑
                          </Button>
                        )}
                        {isExpanded && !isEditing && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => deleteModule(m.id)}>
                            <Trash2 className="w-3 h-3 mr-1" />{builtIn ? "重置" : "删除"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {isExpanded && !isEditing && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-1 flex-wrap">
                          {m.tags.map(t => (
                            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                        <pre className="bg-gray-50 rounded p-3 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto font-mono">
                          {m.content}
                        </pre>
                      </div>
                    )}

                    {isEditing && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">模块名称</label>
                            <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">标签（逗号分隔）</label>
                            <Input value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">描述</label>
                          <Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">知识内容（Markdown）</label>
                          <textarea
                            className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={editForm.content}
                            onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}>
                            <Check className="w-4 h-4 mr-1" />保存
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setExpandedId(null) }}>
                            <X className="w-4 h-4 mr-1" />取消
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {modules.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无知识模块</p>
              <p className="text-xs mt-1">点击"新增模块"开始积累</p>
            </CardContent></Card>
          )}
        </>
      )}

      {activeTab === "rules" && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            内容规则控制 AI 生成内容的质量。每条规则可独立开关，修改后即时生效。
            规则分为 4 类：结构规则（控制骨架）、受众规则（身份认同）、素材规则（选图逻辑）、话术规则（结尾引导）。
          </p>

          <div className="space-y-2">
            {rules.map(r => {
              const isEditing = editingRuleId === r.id
              const isSaved = ruleSavedId === r.id

              return (
                <Card key={r.id} className={isEditing ? "border-violet-300" : isSaved ? "border-green-300" : ""}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{r.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${categoryColors[r.category] || "bg-gray-100 text-gray-600"}`}>
                            {categoryLabels[r.category] || r.category}
                          </span>
                          {isSaved && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {r.appliesTo.map(t => (
                            <span key={t} className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleRuleEnabled(r.id)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${r.enabled ? "bg-violet-600" : "bg-gray-300"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.enabled ? "left-5" : "left-0.5"}`} />
                        </button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEditRule(r)}>
                          <Edit2 className="w-3 h-3 mr-1" />编辑
                        </Button>
                        {isBuiltinRule(r.id) && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => resetRule(r.id)}>
                            <Trash2 className="w-3 h-3 mr-1" />重置
                          </Button>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">规则名称</label>
                            <Input value={ruleEditForm.name} onChange={e => setRuleEditForm({ ...ruleEditForm, name: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">分类</label>
                            <select
                              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                              value={ruleEditForm.category}
                              onChange={e => setRuleEditForm({ ...ruleEditForm, category: e.target.value })}
                            >
                              <option value="structure">结构规则</option>
                              <option value="audience">受众规则</option>
                              <option value="material">素材规则</option>
                              <option value="hook">话术规则</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">描述</label>
                          <Input value={ruleEditForm.description} onChange={e => setRuleEditForm({ ...ruleEditForm, description: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">注入指令（将插入到 Prompt 中）</label>
                          <textarea
                            className="w-full min-h-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={ruleEditForm.instruction}
                            onChange={e => setRuleEditForm({ ...ruleEditForm, instruction: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ruleEditForm.enabled}
                              onChange={e => setRuleEditForm({ ...ruleEditForm, enabled: e.target.checked })}
                            />
                            启用此规则
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveRuleEdit}>
                            <Check className="w-4 h-4 mr-1" />保存
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingRuleId(null)}>
                            <X className="w-4 h-4 mr-1" />取消
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {rules.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无内容规则</p>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  )
}

function isBuiltinRule(id: string): boolean {
  const builtInIds = ["high-arousal-emotion", "information-density", "identity-resonance", "trust-signal", "social-currency", "consistency"]
  return builtInIds.includes(id)
}
