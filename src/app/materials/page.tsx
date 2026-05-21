"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Image as ImageIcon, Crop, Trash2, Check, RefreshCw } from "lucide-react"
import { FatigueBadge } from "@/components/FatigueBadge"
import { MaterialCoveragePanel } from "@/components/MaterialCoveragePanel"

const typeLabels: Record<string, string> = {
  production_line: "生产线",
  spray_line: "喷涂线",
  raw_material: "原材料",
  finished_product: "成品",
  packing_shipping: "打包发货",
  detail_closeup: "细节特写",
  color_swatch: "色板",
  ai_render: "AI效果图",
}

type Asset = {
  id: string
  type: string
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
  const [showFatigued, setShowFatigued] = useState(false)
  const [uploadType, setUploadType] = useState("finished_product")
  const [showUploadPicker, setShowUploadPicker] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

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

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">素材库</h1>
        <Button variant="outline" size="sm" onClick={() => setShowFatigued(!showFatigued)}>
          {showFatigued ? "隐藏疲劳素材" : "显示全部素材"}
        </Button>
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
            {assets.map((asset) => (
              <div key={asset.id} className="group relative rounded-2xl overflow-hidden bg-gray-100">
                <img src={asset.url} alt={asset.title} className="w-full aspect-square object-cover" />
                <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2">
                  <FatigueBadge usageCount={asset.usageCount} isFatigued={asset.isFatigued} />
                </div>
                <div className="absolute bottom-1.5 md:bottom-2 left-1.5 md:left-2 right-1.5 md:right-2 flex items-center justify-between gap-1">
                  <span className="text-[10px] md:text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-full truncate">
                    {typeLabels[asset.type] || asset.type}
                  </span>
                  {asset.lastUsedAt && (
                    <span className="text-[10px] md:text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-full shrink-0">
                      {new Date(asset.lastUsedAt).toLocaleDateString("zh-CN")}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
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
    </div>
  )
}