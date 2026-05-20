"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Image as ImageIcon, FileText, Plus, Trash2, Copy, Crop } from "lucide-react"

type Snippet = { id: string; type: string; title: string; content: string; tags: string }

export default function MaterialsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [images, setImages] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"images" | "snippets">("images")
  const [showSnippetForm, setShowSnippetForm] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formTags, setFormTags] = useState("")
  const [formType, setFormType] = useState("quote")
  const [search, setSearch] = useState("")
  const [uploading, setUploading] = useState(false)

  const [cropSrc, setCropSrc] = useState("")
  const [cropResult, setCropResult] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cropPos, setCropPos] = useState({ x: 0, y: 0, w: 300, h: 400 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    fetch("/api/assets?type=image")
      .then((r) => r.json())
      .then(setImages)
      .catch(() => setImages([]))
  }, [])

  const handleUpload = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (data.url) {
      await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", url: data.url, title: file.name }),
      })
      setImages((prev) => [...prev, data.url])
    }
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) handleUpload(file)
  }

  const handleSaveCrop = () => {
    if (!cropResult) return
    const a = document.createElement("a")
    a.href = cropResult
    a.download = "cropped-3x4.png"
    a.click()
  }

  const startCrop = (src: string) => {
    setCropSrc(src)
    setCropResult("")
    setCropPos({ x: 50, y: 0, w: 300, h: 400 })
  }

  const drawCrop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !cropSrc) return
    const img = new window.Image()
    img.onload = () => {
      const scale = canvas.width / img.width
      const displayH = img.height * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, displayH)

      ctx.fillStyle = "rgba(0,0,0,0.4)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.clearRect(cropPos.x, cropPos.y, cropPos.w, cropPos.h)
      ctx.strokeStyle = "#8b5cf6"
      ctx.lineWidth = 2
      ctx.strokeRect(cropPos.x, cropPos.y, cropPos.w, cropPos.h)
    }
    img.src = cropSrc
  }, [cropSrc, cropPos])

  useEffect(() => {
    if (cropSrc) drawCrop()
  }, [cropSrc, cropPos, drawCrop])

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setDragStart({ x: e.nativeEvent.offsetX - cropPos.x, y: e.nativeEvent.offsetY - cropPos.y })
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const cw = 800
    const x = Math.max(0, Math.min(cw - cropPos.w, e.nativeEvent.offsetX - dragStart.x))
    const y = Math.max(0, Math.min(cropPos.h * 1.5, e.nativeEvent.offsetY - dragStart.y))
    setCropPos((prev) => ({ ...prev, x, y }))
  }

  const handleCanvasMouseUp = () => setDragging(false)

  const confirmCrop = () => {
    const canvas = canvasRef.current
    if (!canvas || !cropSrc) return
    const img = new window.Image()
    img.onload = () => {
      const scale = canvas.width / img.width
      const srcX = cropPos.x / scale
      const srcY = cropPos.y / scale
      const srcW = cropPos.w / scale
      const srcH = cropPos.h / scale

      const out = document.createElement("canvas")
      out.width = cropPos.w
      out.height = cropPos.h
      const octx = out.getContext("2d")
      if (!octx) return
      octx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, cropPos.w, cropPos.h)
      setCropResult(out.toDataURL("image/png"))
    }
    img.src = cropSrc
  }

  const handleAddSnippet = async () => {
    if (!formTitle.trim() || !formContent.trim()) return
    const res = await fetch("/api/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: formType, title: formTitle, content: formContent, tags: formTags }),
    })
    const data = await res.json()
    setSnippets([...snippets, data])
    setFormTitle(""); setFormContent(""); setFormTags("")
    setShowSnippetForm(false)
  }

  const handleCopySnippet = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">素材库</h1>
        <div className="flex gap-2">
          <Button variant={activeTab === "images" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("images")}>
            <ImageIcon className="w-4 h-4 mr-1" /> 图片素材
          </Button>
          <Button variant={activeTab === "snippets" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("snippets")}>
            <FileText className="w-4 h-4 mr-1" /> 文案片段
          </Button>
        </div>
      </div>

      {activeTab === "images" && (
        <div>
          <div
            className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-violet-300 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("img-upload")?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              {uploading ? "上传中..." : "拖拽图片到此处或点击上传"}
            </p>
            <p className="text-xs text-muted-foreground">支持 JPG、PNG，建议 3:4 比例</p>
            <input
              id="img-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUpload(f)
              }}
            />
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            {images.map((url, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="secondary" onClick={() => startCrop(url)}>
                    <Crop className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {images.length === 0 && (
              <div className="rounded-2xl bg-gray-100 aspect-square flex items-center justify-center text-muted-foreground text-sm col-span-4">
                暂无图片，上传第一张图片开始
              </div>
            )}
          </div>

          {cropSrc && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <Card className="w-[900px] max-h-[90vh] overflow-auto">
                <div className="p-4 flex items-center justify-between border-b">
                  <h3 className="font-semibold">3:4 比例裁剪（小红书封面）</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={confirmCrop}>应用到选区</Button>
                    {cropResult && (
                      <Button size="sm" onClick={handleSaveCrop}>下载</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setCropSrc(""); setCropResult("") }}>
                      关闭
                    </Button>
                  </div>
                </div>
                <div className="p-4 flex gap-4">
                  <div className="flex-1">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={600}
                      className="w-full border rounded-lg cursor-move"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    />
                    <p className="text-xs text-muted-foreground mt-1">拖拽选框移动裁剪区域</p>
                  </div>
                  {cropResult && (
                    <div className="w-[180px] shrink-0">
                      <p className="text-xs text-muted-foreground mb-2">预览 (3:4)</p>
                      <img src={cropResult} alt="preview" className="w-full border rounded-lg" />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === "snippets" && (
        <div className="space-y-4">
          {!showSnippetForm ? (
            <Button variant="outline" onClick={() => setShowSnippetForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> 添加文案片段
            </Button>
          ) : (
            <Card>
              <CardContent className="py-4 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">标题</label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="如：工厂直供优势" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">内容</label>
                  <textarea
                    className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="输入文案片段..."
                  />
                </div>
                <div className="flex gap-2">
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={formType} onChange={(e) => setFormType(e.target.value)}>
                    <option value="quote">金句</option>
                    <option value="data">数据</option>
                    <option value="case">案例</option>
                  </select>
                  <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="标签" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSnippetForm(false)}>取消</Button>
                  <Button onClick={handleAddSnippet}>添加</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Input placeholder="搜索片段..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          </div>

          <div className="space-y-3">
            {snippets
              .filter((s) => s.title.includes(search) || s.tags.includes(search))
              .map((s) => (
                <Card key={s.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{s.type === "quote" ? "金句" : s.type === "data" ? "数据" : "案例"}</span>
                          <span className="font-medium text-sm">{s.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.content}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleCopySnippet(s.content)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {snippets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">暂无文案片段，点击上方按钮添加</div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}