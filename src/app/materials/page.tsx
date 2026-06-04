"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Image as ImageIcon, Crop, Trash2, Check, RefreshCw, Sparkles, Share2 } from "lucide-react"
import { FatigueBadge } from "@/components/FatigueBadge"
import { MaterialCoveragePanel } from "@/components/MaterialCoveragePanel"
import { ImageLightbox } from "@/components/ImageLightbox"

const typeLabels: Record<string, string> = {
  production_line: "生产线",
  spray_line: "喷涂线",
  raw_material: "原材料",
  finished_product: "成品",
  packing_shipping: "打包发货",
  detail_closeup: "细节特写",
  color_swatch: "色板",
  ai_render: "AI效果图",
  construction: "现场施工安装",
}

type Asset = {
  id: string
  type: string
  typeSource: string
  url: string
  title: string
  tags: string
  usageCount: number
  lastUsedAt: string | null
  isFatigued: boolean
  createdAt: string
}

export default function MaterialsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [uploading, setUploading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [showFatigued, setShowFatigued] = useState(false)

  const [cropSrc, setCropSrc] = useState("")
  const [cropResult, setCropResult] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cropPos, setCropPos] = useState({ x: 0, y: 0, w: 300, h: 400 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [uploadType, setUploadType] = useState("finished_product")
  const [showUploadPicker, setShowUploadPicker] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [classifyingId, setClassifyingId] = useState<string | null>(null)
  const [classifyMsg, setClassifyMsg] = useState<Record<string, string>>({})

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchAssets()
  }, [categoryFilter, showFatigued])

  const fetchAssets = async () => {
    const params = new URLSearchParams()
    if (categoryFilter) params.set("category", categoryFilter)
    if (showFatigued) params.set("fatigue", "true")
    const res = await fetch(`/api/assets?${params}`)
    const data = await res.json()
    if (Array.isArray(data)) setAssets(data)
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setPendingFiles(Array.from(files))
    setShowUploadPicker(true)
  }

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return
    setUploading(true)
    let success = 0
    for (const file of pendingFiles) {
      const fd = new FormData()
      fd.append("file", file)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (data.url) {
          await fetch("/api/assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: uploadType, url: data.url, title: file.name }),
          })
          success++
        }
      } catch {}
    }
    setShowUploadPicker(false)
    setPendingFiles([])
    setUploading(false)
    fetchAssets()
  }

  const toggleFatigue = async (asset: Asset) => {
    await fetch(`/api/assets/${asset.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFatigued: !asset.isFatigued }),
    })
    fetchAssets()
  }

  const handleGenerateTasks = () => {
    alert("拍摄任务生成功能将在任务调度模块中实现")
  }

  const handleChangeType = async (assetId: string, newType: string) => {
    await fetch(`/api/assets/${assetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType, typeSource: "manual" }),
    })
    setEditingTypeId(null)
    fetchAssets()
  }

  const handleClassify = async (assetId: string) => {
    setClassifyingId(assetId)
    setClassifyMsg((prev) => ({ ...prev, [assetId]: "识别中..." }))
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    const visionModel = localStorage.getItem("openrouter_vision_model") || ""
    if (!apiKey) { alert("请先在设置中配置 API Key"); setClassifyingId(null); return }
    try {
      const res = await fetch("/api/assets/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-vision-model": visionModel,
        },
        body: JSON.stringify({ assetId }),
      })
      const data = await res.json()
      if (data.skipped) {
        setClassifyMsg((prev) => ({ ...prev, [assetId]: "已跳过: " + (data.message || "手动标注") }))
      } else if (data.label) {
        setClassifyMsg((prev) => ({ ...prev, [assetId]: "已识别: " + data.label }))
        setTimeout(() => {
          setClassifyMsg((prev) => {
            const next = { ...prev }
            delete next[assetId]
            return next
          })
        }, 2000)
      } else if (data.error) {
        setClassifyMsg((prev) => ({ ...prev, [assetId]: "失败: " + data.error.slice(0, 20) }))
      } else {
        setClassifyMsg((prev) => ({ ...prev, [assetId]: "识别失败" }))
      }
      fetchAssets()
    } catch {
      setClassifyMsg((prev) => ({ ...prev, [assetId]: "请求失败" }))
    }
    setClassifyingId(null)
  }

  const handleBatchClassify = async () => {
    const apiKey = localStorage.getItem("openrouter_api_key") || ""
    const visionModel = localStorage.getItem("openrouter_vision_model") || ""
    if (!apiKey) { alert("请先在设置中配置 API Key"); return }
    for (const asset of assets) {
      setClassifyingId(asset.id)
      setClassifyMsg((prev) => ({ ...prev, [asset.id]: "识别中..." }))
      try {
        const res = await fetch("/api/assets/classify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "x-vision-model": visionModel,
          },
          body: JSON.stringify({ assetId: asset.id }),
        })
        const data = await res.json()
        if (data.skipped) {
          setClassifyMsg((prev) => ({ ...prev, [asset.id]: "已跳过: " + (data.message || "手动标注") }))
        } else if (data.label) {
          setClassifyMsg((prev) => ({ ...prev, [asset.id]: "已识别: " + data.label }))
        } else if (data.error) {
          setClassifyMsg((prev) => ({ ...prev, [asset.id]: "失败: " + data.error.slice(0, 20) }))
        } else {
          setClassifyMsg((prev) => ({ ...prev, [asset.id]: "识别失败" }))
        }
      } catch {
        setClassifyMsg((prev) => ({ ...prev, [asset.id]: "请求失败" }))
      }
    }
    setClassifyingId(null)
    fetchAssets()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
  }

  const handleMultiShare = async () => {
    if (selectedIds.size === 0) return
    const selectedAssets = assets.filter((a) => selectedIds.has(a.id))

    const canShare = typeof navigator !== "undefined" && !!navigator.share && !!navigator.canShare
    if (!canShare) {
      // 桌面端降级：逐个下载
      for (const asset of selectedAssets) {
        try {
          const res = await fetch(asset.url)
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = asset.title || "image"
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } catch {}
      }
      return
    }

    try {
      const files = await Promise.all(
        selectedAssets.map(async (asset) => {
          const res = await fetch(asset.url)
          const blob = await res.blob()
          const ext = asset.url.split(".").pop()?.split("?")[0] || "jpeg"
          return new File([blob], `${asset.title || "image"}.${ext}`, { type: blob.type })
        })
      )
      await navigator.share({ files })
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        alert("分享失败，请尝试下载")
      }
    }
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

  const handleUploadCrop = async () => {
    if (!cropResult) return
    setUploading(true)
    try {
      const blob = await fetch(cropResult).then((r) => r.blob())
      const fd = new FormData()
      fd.append("file", blob, "cropped-3x4.png")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) {
        await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: uploadType, url: data.url, title: "裁剪图" }),
        })
        fetchAssets()
      }
    } catch {}
    setUploading(false)
    setCropSrc("")
    setCropResult("")
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">素材库</h1>
        <div className="flex gap-1.5 md:gap-2">
          {selectedIds.size > 0 && (
            <>
              <Button variant="default" size="sm" onClick={handleMultiShare} className="bg-violet-600">
                <Share2 className="w-4 h-4 mr-1" /> 分享 ({selectedIds.size})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                取消选择
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleBatchClassify}>
            AI 识别分类
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowFatigued(!showFatigued)}>
            {showFatigued ? "隐藏疲劳素材" : "显示全部素材"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-3">
          <div
            className="border-2 border-dashed border-border rounded-2xl p-6 md:p-12 text-center cursor-pointer hover:border-violet-300 transition-colors"
            onDrop={(e) => {
              e.preventDefault()
              handleFileSelect(e.dataTransfer.files)
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("img-upload")?.click()}
          >
            <Upload className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-1 md:mb-2 text-sm md:text-base">
              {uploading ? "上传中..." : "点击上传或拍照"}
            </p>
            <p className="text-xs text-muted-foreground">支持多选，手机可直接拍照</p>
            <input
              id="img-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {showUploadPicker && (
            <Card className="mt-4">
              <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <span className="text-sm text-muted-foreground shrink-0">分类：</span>
                <select
                  className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 text-sm"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                >
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpload} disabled={uploading}>
                    <Check className="w-4 h-4 mr-1" /> 确认上传
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowUploadPicker(false); setPendingFiles([]) }}>
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-1.5 md:gap-2 mt-4 flex-wrap">
            <Button
              variant={categoryFilter === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("")}
              className="text-xs md:text-sm"
            >
              全部
            </Button>
            {Object.entries(typeLabels).map(([k, v]) => (
              <Button
                key={k}
                variant={categoryFilter === k ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(categoryFilter === k ? "" : k)}
                className="text-xs md:text-sm"
              >
                {v}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
            {assets.map((asset, idx) => (
              <div key={asset.id} className="group relative rounded-2xl bg-gray-100">
                <div
                  className="rounded-2xl overflow-hidden cursor-pointer relative"
                  onClick={() => openLightbox(idx)}
                >
                  <img src={asset.url} alt={asset.title} className="w-full aspect-square object-cover" />
                  {/* 多选复选框 */}
                  <div
                    className="absolute top-1.5 right-1.5 z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelect(asset.id)
                    }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedIds.has(asset.id)
                        ? "bg-violet-600 border-violet-600"
                        : "border-white/60 bg-black/30"
                    }`}>
                      {selectedIds.has(asset.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  {selectedIds.has(asset.id) && (
                    <div className="absolute inset-0 bg-violet-500/10 pointer-events-none" />
                  )}
                </div>
                <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2">
                  <FatigueBadge usageCount={asset.usageCount} isFatigued={asset.isFatigued} />
                </div>
                <div className="absolute bottom-1.5 md:bottom-2 left-1.5 md:left-2 right-1.5 md:right-2 flex items-center justify-between gap-1 z-10">
                  <div className="relative">
                    <button
                      className={`text-[11px] md:text-xs px-2 py-1 rounded-full truncate cursor-pointer transition-colors min-w-[36px] text-center ${
                        asset.typeSource === "manual"
                          ? "bg-violet-600 text-white"
                          : "bg-black/60 hover:bg-black/80 text-white"
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingTypeId(editingTypeId === asset.id ? null : asset.id)
                      }}
                    >
                      {classifyMsg[asset.id] || (typeLabels[asset.type] || asset.type)}
                      {asset.typeSource === "manual" && <span className="ml-1 opacity-70">✦</span>}
                    </button>
                    {editingTypeId === asset.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border p-1 z-20 min-w-[80px]">
                        {Object.entries(typeLabels).map(([k, v]) => (
                          <button
                            key={k}
                            className={`block w-full text-left px-3 py-1.5 rounded text-xs hover:bg-violet-50 whitespace-nowrap ${asset.type === k ? "text-violet-700 font-medium" : ""}`}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleChangeType(asset.id, k)
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {asset.lastUsedAt && (
                    <span className="text-[10px] md:text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-full shrink-0">
                      {new Date(asset.lastUsedAt).toLocaleDateString("zh-CN")}
                    </span>
                  )}
                </div>
                {/* hover 浮层仅桌面端显示，避免触屏设备 tap 时挡住点击放大 */}
                <div className="hidden md:flex absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-0 pointer-events-none group-hover:pointer-events-auto">
                  <Button size="sm" variant="secondary" onClick={() => startCrop(asset.url)}>
                    <Crop className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleClassify(asset.id)} disabled={classifyingId === asset.id}>
                    <Sparkles className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleFatigue(asset)}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="rounded-2xl bg-gray-100 aspect-square flex items-center justify-center text-muted-foreground text-sm col-span-2 sm:col-span-3 lg:col-span-4">
                暂无素材，上传第一张图片开始
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <MaterialCoveragePanel onGenerateTasks={handleGenerateTasks} />
        </div>
      </div>

      {cropSrc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setCropSrc(""); setCropResult("") }}>
          <Card className="w-[900px] max-w-[95vw] max-h-[95vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 flex items-center justify-between border-b">
              <h3 className="font-semibold text-sm md:text-base">3:4 比例裁剪（小红书封面）</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={confirmCrop}>应用到选区</Button>
                {cropResult && (
                  <Button size="sm" onClick={handleUploadCrop} disabled={uploading}>
                    {uploading ? "上传中..." : "上传到素材库"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setCropSrc(""); setCropResult("") }}>关闭</Button>
              </div>
            </div>
            <div className="p-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
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

      {lightboxIndex !== null && (
        <ImageLightbox
          images={assets.map((a) => ({ id: a.id, url: a.url, title: a.title }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onSelect={toggleSelect}
          selectedIds={selectedIds}
        />
      )}
    </div>
  )
}