"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Wand2, Copy, History, Trash2, Save, Calendar, Zap, Users, BookOpen, Truck } from "lucide-react"
import { builtInTemplates } from "@/data/prompt-templates"
import { renderPrompt } from "@/lib/prompt-engine"
import { Alert } from "@/components/Alert"

const contentTypeMeta: Record<string, { label: string; icon: any; desc: string }> = {
  factory_real: { label: "工厂实拍", icon: Users, desc: "生产线/喷涂线/打包" },
  ai_render: { label: "AI效果图", icon: Sparkles, desc: "颜色/工艺/场景" },
  knowledge: { label: "干货科普", icon: BookOpen, desc: "专业知识/避坑" },
  shipping: { label: "发货展示", icon: Truck, desc: "打包/装车/排期" },
}

interface ContentRecord {
  id: string
  title: string
  body: string
  tags: string
  createdAt: string
}

export default function ContentPage() {
  const searchParams = useSearchParams()
  const topicId = searchParams.get("topic") || ""
  const [selectedTemplate, setSelectedTemplate] = useState(builtInTemplates[0])
  const [formValues, setFormValues] = useState<Record<string, string>>({
    选题: searchParams.get("topicTitle") || "",
    目标客户: "建筑装饰公司采购/设计师/工程承包商",
    核心卖点: "工厂直供/质量稳定/价格透明",
    展示内容: "",
    适用场景: "商场/机场/酒店/办公楼",
    问题描述: "",
    专业解答: "",
    emoji数量: "3",
    标签数量: "5",
  })
  const [generatedText, setGeneratedText] = useState("")
  const [contentTitle, setContentTitle] = useState("")
  const [contentBody, setContentBody] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [scheduleDate, setScheduleDate] = useState("")
  const [history, setHistory] = useState<ContentRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<"manual" | "auto">("manual")
  const [autoType, setAutoType] = useState("factory_real")
  const [autoCount, setAutoCount] = useState(1)
  const [autoResults, setAutoResults] = useState<any[]>([])
  const [autoRunning, setAutoRunning] = useState(false)

  useEffect(() => {
    const savedTitle = localStorage.getItem("current_content_title") || ""
    const savedBody = localStorage.getItem("current_generated_text") || ""
    if (savedBody) {
      setGeneratedText(savedBody)
      setContentTitle(savedTitle)
      setContentBody(savedBody)
    }
    fetchHistory()
  }, [])

  const parseGeneratedText = (text: string) => {
    const lines = text.split("\n")
    const firstLine = lines[0]?.trim() || ""
    if (firstLine.startsWith("#") || firstLine.startsWith("【") || firstLine.startsWith("标题") || firstLine.length < 40) {
      return { title: firstLine.replace(/^#+\s*/, ""), body: text }
    }
    return { title: "", body: text }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/content?limit=20")
      const data = await res.json()
      if (Array.isArray(data)) {
        setHistory(data)
      } else {
        setHistory([])
      }
    } catch {
      setHistory([])
    }
  }

  const saveContent = async (title: string, body: string) => {
    try {
      await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topicId || undefined,
          title: title || formValues["选题"] || selectedTemplate.name,
          body,
          tags: selectedTemplate.category,
        }),
      })
      fetchHistory()
    } catch {}
  }

  const handleGenerate = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) {
      setError("请先在设置中配置 OpenRouter API Key")
      return
    }
    const model = localStorage.getItem("openrouter_model") || ""

    setError("")
    setLoading(true)

    const prompt = renderPrompt(selectedTemplate.content, formValues)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ prompt, model }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setGeneratedText(data.content)
        const parsed = parseGeneratedText(data.content)
        setContentTitle(parsed.title || formValues["选题"] || "")
        setContentBody(parsed.body)
        localStorage.setItem("current_generated_text", data.content)
        localStorage.setItem("current_content_title", parsed.title || formValues["选题"] || "")
        await saveContent(parsed.title || formValues["选题"] || "", parsed.body)
      }
    } catch (err) {
      setError("生成失败，请检查网络和 API 配置")
    } finally {
      setLoading(false)
    }
  }

  const handleEnhance = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) {
      setError("请先在设置中配置 OpenRouter API Key")
      return
    }
    const model = localStorage.getItem("openrouter_model") || ""

    setLoading(true)
    try {
      const fullText = contentTitle ? contentTitle + "\n" + contentBody : contentBody
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ originalText: fullText, model }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (data.content) {
        setGeneratedText(data.content)
        const parsed = parseGeneratedText(data.content)
        setContentTitle(parsed.title)
        setContentBody(parsed.body)
        localStorage.setItem("current_generated_text", data.content)
        localStorage.setItem("current_content_title", parsed.title)
        await saveContent(parsed.title, parsed.body)
      }
    } catch {
      setError("优化失败")
    } finally {
      setLoading(false)
    }
  }

  const handleManualSave = async () => {
    const body = contentTitle ? contentTitle + "\n" + contentBody : contentBody
    setGeneratedText(body)
    localStorage.setItem("current_generated_text", body)
    localStorage.setItem("current_content_title", contentTitle)
    await saveContent(contentTitle, contentBody)
  }

  const handleSchedule = async () => {
    if (!scheduleDate) return
    const body = contentTitle ? contentTitle + "\n" + contentBody : contentBody
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topicId || undefined,
          title: contentTitle || formValues["选题"],
          body,
          tags: selectedTemplate.category,
        }),
      })
      const saved = await res.json()
      if (saved.id) {
        await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentId: saved.id,
            date: scheduleDate,
          }),
        })
        setScheduleDate("")
      }
    } catch {}
  }

  const handleAutoGenerate = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    const model = localStorage.getItem("openrouter_model") || ""

    setAutoRunning(true)
    setError("")
    setAutoResults([])

    try {
      const res = await fetch("/api/generate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ count: autoCount, model, scheduleDate }),
      })
      const data = await res.json()
      if (data.results) setAutoResults(data.results)
      if (data.errors?.length > 0) setError(data.errors.join(", "))
      fetchHistory()
    } catch {
      setError("自动生成失败")
    } finally {
      setAutoRunning(false)
    }
  }

  const handleAutoSingle = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    const model = localStorage.getItem("openrouter_model") || ""

    setAutoRunning(true)
    setError("")

    try {
      const res = await fetch("/api/generate/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ contentType: autoType, model, scheduleDate }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else {
        setAutoResults([data])
        fetchHistory()
      }
    } catch {
      setError("自动生成失败")
    } finally {
      setAutoRunning(false)
    }
  }

  const handleCopy = () => {
    const text = contentTitle ? contentTitle + "\n" + contentBody : contentBody
    navigator.clipboard.writeText(text)
  }

  const handleLoadFromHistory = (record: ContentRecord) => {
    setGeneratedText(record.body)
    const parsed = parseGeneratedText(record.body)
    setContentTitle(record.title || parsed.title)
    setContentBody(record.body)
    localStorage.setItem("current_generated_text", record.body)
    localStorage.setItem("current_content_title", record.title)
    setShowHistory(false)
  }

  const handleDeleteHistory = async (id: string) => {
    await fetch(`/api/content/${id}`, { method: "DELETE" })
    fetchHistory()
  }

  const categoryLabels: Record<string, string> = {
    knowledge: "知识科普",
    visual: "视觉展示",
    faq: "客户问答",
  }

  const variables = selectedTemplate.variables

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <h1 className="text-xl md:text-2xl font-bold">内容创作</h1>
          <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm transition-all ${
                activeTab === "manual" ? "bg-white shadow-sm font-medium" : "text-muted-foreground"
              }`}
            >
              手动创作
            </button>
            <button
              onClick={() => setActiveTab("auto")}
              className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm transition-all ${
                activeTab === "auto" ? "bg-white shadow-sm font-medium" : "text-muted-foreground"
              }`}
            >
              <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 inline" /> 自动生成
            </button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
          <History className="w-3.5 h-3.5 mr-1" /> 历史记录 ({history.length})
        </Button>
      </div>

      {showHistory && (
        <Card className="mb-6">
          <CardContent className="py-4 max-h-[300px] overflow-y-auto">
            <div className="space-y-2">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex-1 min-w-0" onClick={() => handleLoadFromHistory(r)}>
                    <div className="text-sm font-medium truncate">{r.title || "无标题"}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.body}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(r.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-red-400 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteHistory(r.id)
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "manual" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left: Template & Parameters */}
        <div className="lg:col-span-1 space-y-3 md:space-y-4">
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold mb-3">选择模板</h3>
              <div className="space-y-2">
                {builtInTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                      selectedTemplate.id === t.id
                        ? "bg-violet-50 text-violet-700 border-2 border-violet-200"
                        : "hover:bg-gray-50 border-2 border-transparent"
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {categoryLabels[t.category]}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold mb-3">填写参数</h3>
              <div className="space-y-3">
                {variables.map((v) => (
                  <div key={v}>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {v}
                    </label>
                    <Input
                      value={formValues[v] || ""}
                      onChange={(e) =>
                        setFormValues({ ...formValues, [v]: e.target.value })
                      }
                      placeholder={v}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={handleGenerate} disabled={loading}>
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? "生成中..." : "AI 生成文案"}
          </Button>

          {generatedText && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleEnhance} disabled={loading}>
                <Wand2 className="w-4 h-4 mr-1" /> AI 优化
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-2">
          <Card className="min-h-[350px] md:min-h-[500px]">
            <CardContent className="py-4">
              {error && (
                <Alert message={error} />
              )}
              {generatedText ? (
                <div className="space-y-4">
                  <Input
                    placeholder="输入标题"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    className="text-base md:text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0"
                  />
                  <textarea
                    className="w-full min-h-[250px] md:min-h-[380px] rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y leading-relaxed"
                    placeholder="编辑正文..."
                    value={contentBody}
                    onChange={(e) => setContentBody(e.target.value)}
                  />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {contentBody.length} 字
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="h-8 flex-1 sm:flex-none rounded-md border border-input bg-background px-2 text-xs"
                      />
                      <Button variant="outline" size="sm" onClick={handleSchedule} disabled={!scheduleDate}>
                        <Calendar className="w-3.5 h-3.5 mr-1" /> 排期
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleManualSave}>
                        <Save className="w-3.5 h-3.5 mr-1" /> 保存
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 md:py-24 text-muted-foreground">
                  <Sparkles className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-30" />
                  <p>选择模板，填写参数</p>
                  <p>点击「AI 生成文案」开始创作</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {activeTab === "auto" && (
        <div className="space-y-3 md:space-y-4">
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold mb-3">内容类型</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(contentTypeMeta).map(([key, meta]) => {
                  const Icon = meta.icon
                  return (
                    <button
                      key={key}
                      onClick={() => setAutoType(key)}
                      className={`p-2 md:p-3 rounded-lg border-2 text-center transition-all ${
                        autoType === key
                          ? "border-violet-400 bg-violet-50"
                          : "border-border hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5 mx-auto mb-1 text-violet-600" />
                      <span className="text-xs font-medium block">{meta.label}</span>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">{meta.desc}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold mb-3">生成设置</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">批量数量</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={autoCount}
                    onChange={(e) => setAutoCount(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">排期日期（可选）</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="flex-1" onClick={handleAutoSingle} disabled={autoRunning}>
              <Zap className="w-4 h-4 mr-1" /> 单条生成
            </Button>
            <Button className="flex-1" variant="outline" onClick={handleAutoGenerate} disabled={autoRunning}>
              {autoRunning ? "生成中..." : `批量生成 ${autoCount} 条`}
            </Button>
          </div>

          {error && <Alert message={error} />}

          {autoResults.length > 0 && (
            <div className="space-y-2 md:space-y-3">
              <h3 className="text-sm font-semibold">生成结果 ({autoResults.length} 条)</h3>
              {autoResults.map((r, i) => (
                <Card key={i}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                        {contentTypeMeta[r.contentType]?.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.images?.split(",").length || 0} 张图
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-4">
                      {r.body || r.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
