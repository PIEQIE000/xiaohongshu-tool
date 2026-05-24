"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Wand2, Copy, Trash2, Save, Zap, Users, BookOpen, Truck, Check, RotateCcw, Eye, ShieldCheck, ChevronDown, ChevronUp, Loader2, Image, RefreshCw, Target, Lightbulb, Trash, Plus } from "lucide-react"
import { builtInTemplates } from "@/data/prompt-templates"
import { renderPrompt } from "@/lib/prompt-engine"
import { Alert } from "@/components/Alert"

type ContentStatus = "draft" | "pending" | "published"
type Tab = "drafts" | "pending" | "published" | "manual" | "auto"

const statusLabels: Record<ContentStatus, string> = { draft: "草稿", pending: "待发布", published: "已发布" }
const statusColors: Record<ContentStatus, string> = { draft: "bg-gray-100 text-gray-600", pending: "bg-amber-100 text-amber-700", published: "bg-green-100 text-green-700" }

interface ContentItem {
  id: string; title: string; body: string; tags: string; contentType: string; status: ContentStatus;
  createdAt: string; publishedAt?: string; reviewScore?: number; reviewFeedback?: string; reviewedAt?: string;
  imagePrompt?: string; imagePrompts?: string;
}

interface ImagePrompt { scene: string; prompt: string }

const contentTypeMeta: Record<string, { label: string; icon: any; desc: string }> = {
  factory_real: { label: "工厂实拍", icon: Users, desc: "生产线/喷涂线/打包" },
  ai_render: { label: "AI效果图", icon: Sparkles, desc: "颜色/工艺/场景" },
  knowledge: { label: "干货科普", icon: BookOpen, desc: "专业知识/避坑" },
  shipping: { label: "发货展示", icon: Truck, desc: "打包/装车/排期" },
}

const contentTypeTemplateCategory: Record<string, string> = {
  factory_real: "faq",
  ai_render: "visual",
  knowledge: "knowledge",
  shipping: "faq",
}

function ContentPageInner() {
  const searchParams = useSearchParams()
  const topicId = searchParams.get("topic") || ""
  const topicTitle = searchParams.get("topicTitle") || ""
  const topicContentType = searchParams.get("topicContentType") || ""

  const [allContent, setAllContent] = useState<ContentItem[]>([])
  const [activeTab, setActiveTab] = useState<Tab>("drafts")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [selectedTemplate, setSelectedTemplate] = useState(builtInTemplates[0])
  const [formValues, setFormValues] = useState<Record<string, string>>({
    选题: topicTitle,
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
  const [contentId, setContentId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<ContentStatus>("draft")
  const [editorImagePrompt, setEditorImagePrompt] = useState("")
  const [imagePrompts, setImagePrompts] = useState<ImagePrompt[]>([])
  const [generatingBatchPrompts, setGeneratingBatchPrompts] = useState(false)
  const [generatingSinglePrompt, setGeneratingSinglePrompt] = useState<number | null>(null)
  const [scheduleDate, setScheduleDate] = useState("")
  const [autoType, setAutoType] = useState("factory_real")
  const [autoCount, setAutoCount] = useState(1)
  const [autoRunning, setAutoRunning] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [generatingPromptId, setGeneratingPromptId] = useState<string | null>(null)
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [reviewResults, setReviewResults] = useState<Record<string, any>>({})
  const [currentReview, setCurrentReview] = useState<any>(null)
  const [showReview, setShowReview] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [applyingReview, setApplyingReview] = useState(false)

  useEffect(() => {
    const savedBody = localStorage.getItem("current_generated_text") || ""
    if (savedBody) {
      setGeneratedText(savedBody)
      setContentTitle(localStorage.getItem("current_content_title") || "")
      setContentBody(savedBody)
    }
    fetchContent()
  }, [])

  useEffect(() => {
    const savedTab = localStorage.getItem("content_tab")
    if (savedTab) { setActiveTab(savedTab as Tab); localStorage.removeItem("content_tab") }
    if (topicTitle) {
      setFormValues(prev => ({ ...prev, 选题: topicTitle }))
    }
    if (topicContentType) {
      const cat = contentTypeTemplateCategory[topicContentType] || "knowledge"
      const tmpl = builtInTemplates.find(t => t.category === cat) || builtInTemplates[0]
      setSelectedTemplate(tmpl)
    }
  }, [topicTitle, topicContentType])

  useEffect(() => {
    if (currentReview) {
      setReviewResults(prev => ({ ...prev, [currentReview.contentId || contentId || ""]: currentReview }))
    }
  }, [currentReview])

  const getApiHeaders = (extra?: Record<string, string>): Record<string, string> => {
    const raw = localStorage.getItem("openrouter_model") || ""
    return {
      "Content-Type": "application/json",
      "x-api-key": localStorage.getItem("openrouter_api_key") || "",
      "x-models": raw.replace(/[\r\n]+/g, ",").trim(),
      ...(extra || {}),
    }
  }

  const fetchContent = async (status?: string) => {
    try {
      const url = status ? `/api/content?limit=50&status=${status}` : "/api/content?limit=50"
      const res = await fetch(url)
      const data = await res.json()
      setAllContent(Array.isArray(data) ? data : [])
    } catch { setAllContent([]) }
  }

  const parseGeneratedText = (text: string) => {
    const lines = text.split("\n")
    const firstLine = lines[0]?.trim() || ""
    if (firstLine.startsWith("#") || firstLine.startsWith("【") || firstLine.startsWith("标题") || firstLine.length < 40) {
      return { title: firstLine.replace(/^#+\s*/, ""), body: text }
    }
    return { title: "", body: text }
  }

  const saveContent = async (title: string, body: string, status?: ContentStatus, imagePrompt?: string, imagePromptsStr?: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topicId || undefined,
          title: title || formValues["选题"] || selectedTemplate.name,
          body,
          tags: selectedTemplate.category === "knowledge" ? "知识科普" : selectedTemplate.category === "visual" ? "视觉展示" : "客户问答",
          contentType: topicContentType || "knowledge",
          publishHook: undefined,
          scheduledAt: scheduleDate || undefined,
          imagePrompt: imagePrompt || undefined,
          imagePrompts: imagePromptsStr || undefined,
        }),
      })
      const data = await res.json()
      fetchContent()
      return data.id || null
    } catch { return null }
  }

  const updateContentStatus = async (id: string, status: ContentStatus) => {
    try {
      await fetch("/api/content", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      fetchContent()
      if (currentStatus !== undefined) setCurrentStatus(status)
    } catch {}
  }

  const deleteContent = async (id: string) => {
    await fetch(`/api/content/${id}`, { method: "DELETE" })
    fetchContent()
  }

  const loadContentToEditor = (item: ContentItem) => {
    setGeneratedText(item.body)
    setContentTitle(item.title); setContentBody(item.body); setContentId(item.id); setCurrentStatus(item.status)
    setEditorImagePrompt(item.imagePrompt || "")
    try {
      const p = JSON.parse(item.imagePrompts || "[]")
      setImagePrompts(Array.isArray(p) ? p : [])
      setShowPrompts(p.length > 0)
    } catch { setImagePrompts([]); setShowPrompts(false) }
    if (item.reviewScore) {
      let review: any = { totalScore: item.reviewScore }
      try {
        if (item.reviewFeedback) {
          const parsed = JSON.parse(item.reviewFeedback)
          review = { ...review, ...parsed, reviewedAt: item.reviewedAt }
        }
      } catch {
        review.feedback = item.reviewFeedback
      }
      setCurrentReview(review)
      setShowReview(true)
    } else {
      setCurrentReview(null)
      setShowReview(false)
    }
    setActiveTab("manual")
  }

  const handleGenerate = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    setError(""); setLoading(true)
    const prompt = renderPrompt(selectedTemplate.content, formValues)
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: getApiHeaders(),
        body: JSON.stringify({
          prompt,
          model: localStorage.getItem("openrouter_model") || "",
          contentType: topicContentType || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else {
        setGeneratedText(data.content)
        const parsed = parseGeneratedText(data.content)
        setContentTitle(parsed.title || formValues["选题"] || "")
        setContentBody(parsed.body)
        localStorage.setItem("current_generated_text", data.content)
        localStorage.setItem("current_content_title", parsed.title || formValues["选题"] || "")
        const newId = await saveContent(parsed.title || formValues["选题"] || "", parsed.body)
        if (newId) setContentId(newId)
      }
    } catch (e: any) {
      console.error("[handleGenerate] error:", e?.message || e)
      setError(e?.message || "生成失败，请检查网络连接和 API 配置")
    } finally { setLoading(false) }
  }

  const handleEnhance = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    setLoading(true)
    try {
      const fullText = contentTitle ? contentTitle + "\n" + contentBody : contentBody
      const reviewFeedback = currentReview?.issues?.join("\n") || ""
      const reviewAdvice = currentReview?.feedback || ""
      const res = await fetch("/api/enhance", {
        method: "POST", headers: getApiHeaders(),
        body: JSON.stringify({
          originalText: fullText,
          reviewFeedback,
          reviewAdvice,
          contentType: topicContentType || undefined,
          model: localStorage.getItem("openrouter_model") || "",
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else if (data.content) {
        setGeneratedText(data.content)
        const parsed = parseGeneratedText(data.content)
        setContentTitle(parsed.title); setContentBody(parsed.body)
        localStorage.setItem("current_generated_text", data.content)
        localStorage.setItem("current_content_title", parsed.title)
        if (contentId) {
          await fetch("/api/content", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: contentId, title: parsed.title, body: parsed.body }),
          })
          fetchContent()
        } else {
          const newId = await saveContent(parsed.title, parsed.body)
          if (newId) setContentId(newId)
        }
      }
    } catch (e: any) {
      console.error("[handleEnhance] error:", e?.message || e)
      setError(e?.message || "优化失败，请检查网络连接")
    }
    finally { setLoading(false) }
  }

  const handleApplyReview = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    if (!currentReview) { setError("没有审核反馈"); return }
    setApplyingReview(true)
    try {
      const fullText = contentTitle ? contentTitle + "\n" + contentBody : contentBody
      const reviewFeedback = currentReview.issues?.join("\n") || ""
      const reviewAdvice = currentReview.feedback || ""
      const res = await fetch("/api/enhance/apply", {
        method: "POST", headers: getApiHeaders(),
        body: JSON.stringify({
          originalText: fullText,
          reviewFeedback,
          reviewAdvice,
          contentType: topicContentType || undefined,
          model: localStorage.getItem("openrouter_model") || "",
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else if (data.content) {
        const titleMatch = data.content.match(/【新标题】\s*(.+)/)
        const bodyMatch = data.content.match(/【正文】\s*([\s\S]+)/)
        const newTitle = titleMatch ? titleMatch[1].trim() : contentTitle
        const newBody = bodyMatch ? bodyMatch[1].trim() : data.content
        setContentTitle(newTitle)
        setContentBody(newBody)
        const combined = newTitle + "\n" + newBody
        setGeneratedText(combined)
        localStorage.setItem("current_generated_text", combined)
        localStorage.setItem("current_content_title", newTitle)
        if (contentId) {
          await fetch("/api/content", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: contentId, title: newTitle, body: newBody }),
          })
          fetchContent()
        }
      }
    } catch (e: any) {
      console.error("[handleApplyReview] error:", e?.message || e)
      setError(e?.message || "应用建议失败，请检查网络连接")
    }
    finally { setApplyingReview(false) }
  }

  const handleManualSave = async (targetStatus?: ContentStatus) => {
    const body = contentTitle ? contentTitle + "\n" + contentBody : contentBody
    setGeneratedText(body)
    localStorage.setItem("current_generated_text", body)
    localStorage.setItem("current_content_title", contentTitle)
    const newStatus = targetStatus || currentStatus
    if (contentId) {
      await fetch("/api/content", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contentId, title: contentTitle, body: contentBody, imagePrompt: editorImagePrompt, imagePrompts: JSON.stringify(imagePrompts), status: newStatus }),
      })
      setCurrentStatus(newStatus)
      fetchContent()
    } else {
      const newId = await saveContent(contentTitle, contentBody, newStatus, editorImagePrompt, JSON.stringify(imagePrompts))
      if (newId) { setContentId(newId); setCurrentStatus(newStatus) }
    }
  }

  const handleAutoGenerate = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    const raw = localStorage.getItem("auto_gen_config")
    let config: any = {}
    if (raw) { try { config = JSON.parse(raw) } catch {} }
    const count = config.dailyCount || autoCount
    const ratios = config.contentTypeRatios || { factory_real: 30, ai_render: 30, knowledge: 25, shipping: 15 }
    setAutoRunning(true); setError("")
    try {
      const res = await fetch("/api/generate/batch", {
        method: "POST", headers: getApiHeaders(),
        body: JSON.stringify({ count, contentTypeRatios: ratios, model: localStorage.getItem("openrouter_model") || "", scheduleDate }),
      })
      const data = await res.json()
      if (data.results?.length > 0) await fetchContent("draft")
      if (data.errors?.length > 0) setError(data.errors.join(", "))
    } catch (e: any) {
      console.error("[handleAutoGenerate] error:", e?.message || e)
      setError(e?.message || "自动生成失败，请检查网络连接")
    }
    finally { setAutoRunning(false) }
  }

  const handleReview = useCallback(async (item?: ContentItem) => {
    const target = item || { id: contentId || "", title: contentTitle, body: contentBody, contentType: topicContentType || "knowledge" }
    if (!target.id && !contentBody) { setError("没有可审核的内容"); return }
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    setReviewingId(target.id || "current"); setError("")
    try {
      const res = await fetch("/api/content/review", {
        method: "POST", headers: getApiHeaders(),
        body: JSON.stringify({ contentId: target.id || null, title: target.title, body: target.body, contentType: target.contentType }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else {
        setCurrentReview(data)
        setShowReview(true)
        if (target.id) {
          setReviewResults(prev => ({ ...prev, [target.id]: data }))
          fetchContent()
        }
      }
    } catch (e: any) {
      console.error("[handleReview] error:", e?.message || e)
      setError(e?.message || "审核失败，请检查网络连接")
    }
    finally { setReviewingId(null) }
  }, [contentId, contentBody, contentTitle, topicContentType])

  const handleGenerateImagePrompt = async (item: ContentItem) => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    setGeneratingPromptId(item.id); setError("")
    try {
      const res = await fetch("/api/image-prompt", {
        method: "POST", headers: getApiHeaders(),
        body: JSON.stringify({ contentId: item.id }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else { await fetchContent() }
    } catch (e: any) {
      console.error("[handleGenerateImagePrompt] error:", e?.message || e)
      setError(e?.message || "生成失败，请检查网络连接")
    }
    finally { setGeneratingPromptId(null) }
  }

  const handleGenerateBatchPrompts = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    if (!contentId) { setError("请先保存内容再生成配图方案"); return }
    setGeneratingBatchPrompts(true); setError("")
    try {
      const res = await fetch("/api/image-prompts/batch", {
        method: "POST", headers: getApiHeaders(),
        body: JSON.stringify({ contentId }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else if (Array.isArray(data.prompts)) {
        setImagePrompts(data.prompts)
        setShowPrompts(true)
        await fetch("/api/content", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: contentId, imagePrompts: JSON.stringify(data.prompts) }),
        })
      }
    } catch (e: any) {
      console.error("[handleGenerateBatchPrompts] error:", e?.message || e)
      setError(e?.message || "生成失败，请检查网络连接")
    }
    finally { setGeneratingBatchPrompts(false) }
  }

  const handleRegenerateSinglePrompt = async (index: number) => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    if (!contentId) return
    setGeneratingSinglePrompt(index); setError("")
    try {
      const res = await fetch("/api/image-prompt", {
        method: "POST", headers: getApiHeaders(),
        body: JSON.stringify({ contentId }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else {
        const updated = [...imagePrompts]
        updated[index] = { ...updated[index], prompt: data.imagePrompt }
        setImagePrompts(updated)
        await fetch("/api/content", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: contentId, imagePrompts: JSON.stringify(updated) }),
        })
      }
    } catch (e: any) {
      console.error("[handleRegenerateSinglePrompt] error:", e?.message || e)
      setError(e?.message || "生成失败，请检查网络连接")
    }
    finally { setGeneratingSinglePrompt(null) }
  }

  const handleDeletePrompt = (index: number) => {
    const updated = imagePrompts.filter((_, i) => i !== index)
    setImagePrompts(updated)
    if (contentId) {
      fetch("/api/content", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contentId, imagePrompts: JSON.stringify(updated) }),
      })
    }
  }

  const handleAddEmptyPrompt = () => setImagePrompts([...imagePrompts, { scene: "", prompt: "" }])

  const handleUpdatePrompt = (index: number, field: keyof ImagePrompt, value: string) => {
    const updated = [...imagePrompts]
    updated[index] = { ...updated[index], [field]: value }
    setImagePrompts(updated)
  }

  const parseReview = (item: ContentItem): any => {
    if (reviewResults[item.id]) return reviewResults[item.id]
    if (item.reviewFeedback) { try { return JSON.parse(item.reviewFeedback) } catch { return null } }
    return null
  }

  const handleAutoSingle = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    if (!apiKey) { setError("请先在设置中配置 OpenRouter API Key"); return }
    setAutoRunning(true); setError("")
    try {
      const res = await fetch("/api/generate/auto", {
        method: "POST", headers: getApiHeaders(),
        body: JSON.stringify({ contentType: autoType, model: localStorage.getItem("openrouter_model") || "", scheduleDate }),
      })
      const data = await res.json()
      if (!data.error) { await fetchContent("draft") }
      else { setError(data.error) }
    } catch (e: any) {
      console.error("[handleAutoSingle] error:", e?.message || e)
      setError(e?.message || "自动生成失败，请检查网络连接")
    }
    finally { setAutoRunning(false) }
  }

  const handleCopy = () => {
    const text = contentTitle ? contentTitle + "\n" + contentBody : contentBody
    navigator.clipboard.writeText(text)
  }

  const handleCopyPrompt = (text: string) => navigator.clipboard.writeText(text)

  const handleCopyForPublish = (item: ContentItem) => {
    const text = `${item.title}\n\n${item.body}`
    navigator.clipboard.writeText(text)
  }

  const filteredContent = activeTab === "drafts" ? allContent.filter(c => c.status === "draft")
    : activeTab === "pending" ? allContent.filter(c => c.status === "pending")
    : activeTab === "published" ? allContent.filter(c => c.status === "published") : []

  const counts = {
    drafts: allContent.filter(c => c.status === "draft").length,
    pending: allContent.filter(c => c.status === "pending").length,
    published: allContent.filter(c => c.status === "published").length,
  }

  const managementTabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: "drafts", label: "草稿箱", count: counts.drafts },
    { key: "pending", label: "待发布", count: counts.pending },
    { key: "published", label: "已发布", count: counts.published },
  ]

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl md:text-2xl font-bold">内容管理</h1>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4 w-fit flex-wrap">
        {managementTabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm transition-all flex items-center gap-1.5 ${activeTab === t.key ? "bg-white shadow-sm font-medium" : "text-muted-foreground"}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-violet-100 text-violet-700" : "bg-gray-200 text-gray-500"}`}>{t.count}</span>
          </button>
        ))}
        <button onClick={() => setActiveTab("manual")}
          className={`px-3 py-1.5 rounded-md text-sm transition-all ${activeTab === "manual" ? "bg-white shadow-sm font-medium" : "text-muted-foreground"}`}>
          内容工作台
        </button>
        <button onClick={() => setActiveTab("auto")}
          className={`px-3 py-1.5 rounded-md text-sm transition-all ${activeTab === "auto" ? "bg-white shadow-sm font-medium" : "text-muted-foreground"}`}>
          自动生成
        </button>
      </div>

      {(activeTab === "drafts" || activeTab === "pending" || activeTab === "published") && (
        <div className="space-y-3">
          {filteredContent.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-sm">暂无{managementTabs.find(t => t.key === activeTab)?.label}内容</p>
              <button onClick={() => setActiveTab("manual")} className="text-xs text-violet-600 underline mt-1">去创作 →</button>
            </CardContent></Card>
          )}
          {filteredContent.map(item => {
            const meta = contentTypeMeta[item.contentType] || contentTypeMeta.knowledge
            const Icon = meta.icon
            const review = parseReview(item)
            const scoreColor = review?.totalScore && review.totalScore >= 80 ? "text-green-600 bg-green-50" : review?.totalScore && review.totalScore >= 60 ? "text-amber-600 bg-amber-50" : review?.totalScore ? "text-red-600 bg-red-50" : "text-gray-400 bg-gray-100"
            return (
              <Card key={item.id}><CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadContentToEditor(item)}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>{statusLabels[item.status]}</span>
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Icon className="w-3 h-3" /> {meta.label}</span>
                      {(item.reviewScore !== null && item.reviewScore !== undefined) && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${scoreColor}`}>审核 {item.reviewScore}分</span>
                      )}
                      <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("zh-CN")}</span>
                      {item.publishedAt && <span className="text-xs text-green-600">发布于 {new Date(item.publishedAt).toLocaleDateString("zh-CN")}</span>}
                    </div>
                    <div className="text-sm font-medium truncate">{item.title || "无标题"}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.body}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === "draft" && (
                      <>
                        <Button variant="ghost" size="sm" title="AI 审核" onClick={() => handleReview(item)} disabled={reviewingId === item.id}>
                          {reviewingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />}
                        </Button>
                        <Button variant="ghost" size="sm" title="审核通过，移入待发布" onClick={() => updateContentStatus(item.id, "pending")}>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" title="复制内容" onClick={() => handleCopyForPublish(item)}>
                          <Copy className="w-3.5 h-3.5 text-violet-500" />
                        </Button>
                      </>
                    )}
                    {item.status === "pending" && (
                      <>
                        <Button variant="ghost" size="sm" title="一键复制（标题+正文）" onClick={() => handleCopyForPublish(item)}>
                          <Copy className="w-3.5 h-3.5 text-violet-500" />
                        </Button>
                        <Button variant="ghost" size="sm" title="标记为已发布" onClick={() => updateContentStatus(item.id, "published")}>
                          <Eye className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" title="退回草稿" onClick={() => updateContentStatus(item.id, "draft")}>
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        </Button>
                      </>
                    )}
                    {item.status === "published" && (
                      <>
                        <Button variant="ghost" size="sm" title="复制内容" onClick={() => handleCopyForPublish(item)}>
                          <Copy className="w-3.5 h-3.5 text-violet-500" />
                        </Button>
                        <Button variant="ghost" size="sm" title="退回草稿" onClick={() => updateContentStatus(item.id, "draft")}>
                          <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteContent(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {review && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => setExpandedReview(expandedReview === item.id ? null : item.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full text-left">
                      {expandedReview === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      AI 审核详情
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${review.totalScore >= 80 ? 'bg-green-100 text-green-700' : review.totalScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {review.totalScore}分 {review.verdict === "pass" ? "通过" : review.verdict === "warn" ? "提醒" : "打回"}
                      </span>
                    </button>
                    {expandedReview === item.id && (
                      <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-2">
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {(["titleScore", "angleScore", "storyScore", "toneScore", "redlineScore"] as const).map((key, idx) => (
                            <div key={key} className="bg-white rounded p-1.5">
                              <div className="text-gray-400">{["标题", "角度", "故事", "语气", "红线"][idx]}</div>
                              <div className={`font-bold text-sm ${review[key] >= 16 ? 'text-green-600' : review[key] >= 12 ? 'text-amber-600' : 'text-red-600'}`}>{review[key]}</div>
                            </div>
                          ))}
                        </div>
                        {review.feedback && <div className="text-gray-600 leading-relaxed">{review.feedback}</div>}
                        {review.issues && review.issues.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-gray-400 font-medium">待改进：</div>
                            {review.issues.map((issue: string, i: number) => (
                              <div key={i} className="flex items-start gap-1.5 text-red-600"><span className="mt-0.5 shrink-0">•</span><span>{issue}</span></div>
                            ))}
                          </div>
                        )}
                        {review.reviewedAt && <div className="text-gray-400">审核时间：{new Date(review.reviewedAt).toLocaleString("zh-CN")}</div>}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Image className="w-3.5 h-3.5" />配图提示词</div>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-violet-600" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.imagePrompt || "") }} disabled={!item.imagePrompt}>
                        <Copy className="w-3 h-3 mr-0.5" />复制
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-amber-600" onClick={(e) => { e.stopPropagation(); handleGenerateImagePrompt(item) }} disabled={generatingPromptId === item.id}>
                        {generatingPromptId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : item.imagePrompt ? <RefreshCw className="w-3 h-3 mr-0.5" /> : <Sparkles className="w-3 h-3 mr-0.5" />}
                        {item.imagePrompt ? "重新生成" : "生成"}
                      </Button>
                    </div>
                  </div>
                  {item.imagePrompt ? (
                    <div className="mt-1.5 p-2 bg-violet-50 rounded text-xs text-gray-700 leading-relaxed line-clamp-3">{item.imagePrompt}</div>
                  ) : (
                    <div className="mt-1.5 p-2 bg-gray-50 rounded text-xs text-muted-foreground">点击「生成」按钮获取配图提示词，复制后到即梦/Midjourney等工具生图</div>
                  )}
                </div>
              </CardContent></Card>
            )
          })}
        </div>
      )}

      {activeTab === "manual" && (
        <div className="space-y-4">
          {topicTitle && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="py-3 flex items-center gap-3">
                <Target className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-amber-700 font-medium">当前选题：</span>
                  <span className="text-sm font-medium text-amber-900 ml-1">{topicTitle}</span>
                </div>
                {topicContentType && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                    {(contentTypeMeta[topicContentType] || {}).label || topicContentType}
                  </span>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(builtInTemplates.find(t => t.category === "knowledge") || builtInTemplates[0])} className={selectedTemplate.category === "knowledge" ? "border-violet-400 bg-violet-50" : ""}>
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-violet-600" />知识科普
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(builtInTemplates.find(t => t.category === "visual") || builtInTemplates[1])} className={selectedTemplate.category === "visual" ? "border-violet-400 bg-violet-50" : ""}>
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-violet-600" />视觉展示
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(builtInTemplates.find(t => t.category === "faq") || builtInTemplates[2])} className={selectedTemplate.category === "faq" ? "border-violet-400 bg-violet-50" : ""}>
                  <Users className="w-3.5 h-3.5 mr-1 text-violet-600" />客户问答
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
                <Button size="sm" onClick={handleGenerate} disabled={loading}>
                  <Sparkles className="w-3.5 h-3.5 mr-1" />{loading ? "生成中..." : "AI 生成"}
                </Button>
                {generatedText && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEnhance} disabled={loading}>
                      <Wand2 className="w-3.5 h-3.5 mr-1" />优化
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleReview()} disabled={reviewingId === (contentId || "current")}>
                      {reviewingId === (contentId || "current") ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1" />}
                      AI 审核
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerateBatchPrompts} disabled={generatingBatchPrompts || !contentId}>
                      {generatingBatchPrompts ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Image className="w-3.5 h-3.5 mr-1" />}
                      AI 配图
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="w-3.5 h-3.5" /></Button>
                    <div className="flex-1" />
                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs" />
                    <Button size="sm" onClick={() => handleManualSave()}><Save className="w-3.5 h-3.5 mr-1" />保存草稿</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleManualSave("pending")}><Check className="w-3.5 h-3.5 mr-1" />保存到待发布</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {!generatedText && (
            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold mb-3">填写参数</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedTemplate.variables.map(v => (
                    <div key={v}>
                      <label className="text-xs text-muted-foreground mb-1 block">{v}</label>
                      <Input value={formValues[v] || ""} onChange={e => setFormValues({ ...formValues, [v]: e.target.value })} placeholder={v} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="min-h-[300px]">
            <CardContent className="py-4">
              {error && <Alert message={error} />}
              {generatedText ? (
                <div className="space-y-3">
                  <Input placeholder="输入标题" value={contentTitle} onChange={e => setContentTitle(e.target.value)} className="text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0" />
                  <textarea className="w-full min-h-[300px] md:min-h-[400px] rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y leading-relaxed" placeholder="编辑正文..." value={contentBody} onChange={e => setContentBody(e.target.value)} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{contentBody.length} 字</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 md:py-24 text-muted-foreground">
                  <Sparkles className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-30" />
                  <p>选择模板类型，填写参数</p>
                  <p>点击「AI 生成」开始创作</p>
                </div>
              )}
            </CardContent>
          </Card>

          {generatedText && (
            <>
              {showReview && currentReview && (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-violet-600" />AI 审核结果
                      </h3>
                      <button onClick={() => setShowReview(false)} className="text-xs text-muted-foreground hover:text-foreground">收起</button>
                    </div>
                    <div className="space-y-3">
                      <div className={`text-center p-3 rounded text-2xl font-bold ${currentReview.totalScore >= 80 ? 'bg-green-100 text-green-700' : currentReview.totalScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {currentReview.totalScore}分 {currentReview.verdict === "pass" ? "通过" : currentReview.verdict === "warn" ? "提醒" : "打回"}
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        {(["titleScore", "angleScore", "storyScore", "toneScore", "redlineScore"] as const).map((key, idx) => (
                          <div key={key} className="bg-gray-50 rounded p-2">
                            <div className="text-gray-400">{["标题", "角度", "故事", "语气", "红线"][idx]}</div>
                            <div className={`font-bold text-lg ${currentReview[key] >= 16 ? 'text-green-600' : currentReview[key] >= 12 ? 'text-amber-600' : 'text-red-600'}`}>{currentReview[key]}</div>
                          </div>
                        ))}
                      </div>
                      {currentReview.feedback && <div className="text-sm text-gray-600 leading-relaxed">{currentReview.feedback}</div>}
                      {currentReview.issues && currentReview.issues.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-400 font-medium">待改进：</div>
                          {currentReview.issues.map((issue: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-red-600"><span className="mt-0.5 shrink-0">•</span><span>{issue}</span></div>
                          ))}
                        </div>
                      )}
                      {currentReview.issues && currentReview.issues.length > 0 && (
                        <Button size="sm" onClick={handleApplyReview} disabled={applyingReview} className="w-full mt-2 bg-violet-600 hover:bg-violet-700">
                          <Check className="w-3.5 h-3.5 mr-1" />{applyingReview ? "应用建议中..." : "接纳建议"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {showPrompts && imagePrompts.length > 0 && (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Image className="w-4 h-4 text-violet-600" />配图方案
                        <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">{imagePrompts.length}张</span>
                      </h3>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={handleAddEmptyPrompt}><Plus className="w-3 h-3 mr-1" />添加</Button>
                        <Button variant="ghost" size="sm" onClick={handleGenerateBatchPrompts} disabled={generatingBatchPrompts}>
                          {generatingBatchPrompts ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}重新生成
                        </Button>
                        <button onClick={() => setShowPrompts(false)} className="text-xs text-muted-foreground hover:text-foreground ml-2">收起</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {imagePrompts.map((p, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">图{i + 1}</span>
                            <div className="flex gap-0.5">
                              <Button variant="ghost" size="sm" className="h-5 text-xs text-violet-600" onClick={() => handleCopyPrompt(p.prompt)} disabled={!p.prompt}><Copy className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-5 text-xs text-amber-600" onClick={() => handleRegenerateSinglePrompt(i)} disabled={generatingSinglePrompt === i}>
                                {generatingSinglePrompt === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-5 text-xs text-red-400" onClick={() => handleDeletePrompt(i)}><Trash className="w-3 h-3" /></Button>
                            </div>
                          </div>
                          {p.scene && <div className="text-xs text-gray-500 font-medium">{p.scene}</div>}
                          {p.prompt ? (
                            <div className="text-xs text-gray-700 leading-relaxed bg-white rounded p-2 line-clamp-4">{p.prompt}</div>
                          ) : (
                            <textarea className="w-full min-h-[60px] rounded border border-input bg-background px-2 py-1 text-xs resize-y" placeholder="手动输入提示词..." value={p.prompt} onChange={e => handleUpdatePrompt(i, "prompt", e.target.value)} />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "auto" && (
        <div className="space-y-3 md:space-y-4">
          <Card><CardContent className="py-4">
            <h3 className="text-sm font-semibold mb-3">内容类型</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(contentTypeMeta).map(([key, meta]) => {
                const Icon = meta.icon
                return (
                  <button key={key} onClick={() => setAutoType(key)} className={`p-2 md:p-3 rounded-lg border-2 text-center transition-all ${autoType === key ? "border-violet-400 bg-violet-50" : "border-border hover:bg-gray-50"}`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5 mx-auto mb-1 text-violet-600" />
                    <span className="text-xs font-medium block">{meta.label}</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{meta.desc}</span>
                  </button>
                )
              })}
            </div>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <h3 className="text-sm font-semibold mb-3">生成设置</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">批量数量</label>
                <Input type="number" min={1} max={10} value={autoCount} onChange={e => setAutoCount(parseInt(e.target.value) || 1)} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">排期日期（可选）</label>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
              </div>
            </div>
          </CardContent></Card>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="flex-1" onClick={handleAutoSingle} disabled={autoRunning}><Zap className="w-4 h-4 mr-1" /> 单条生成</Button>
            <Button className="flex-1" variant="outline" onClick={handleAutoGenerate} disabled={autoRunning}>{autoRunning ? "生成中..." : `批量生成 ${autoCount} 条`}</Button>
          </div>
          {error && <Alert message={error} />}
        </div>
      )}
    </div>
  )
}

export default function ContentPage() {
  return (
    <Suspense fallback={<div className="p-4 md:p-6 flex items-center justify-center min-h-[300px]"><div className="text-muted-foreground">加载中...</div></div>}>
      <ContentPageInner />
    </Suspense>
  )
}