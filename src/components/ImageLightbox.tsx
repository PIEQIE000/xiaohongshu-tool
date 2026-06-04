"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, X, Download, Share2 } from "lucide-react"

type ImageItem = {
  id: string
  url: string
  title: string
}

interface ImageLightboxProps {
  images: ImageItem[]
  currentIndex: number
  onClose: () => void
  onSelect?: (id: string) => void
  selectedIds?: Set<string>
}

export function ImageLightbox({ images, currentIndex: initialIndex, onClose, onSelect, selectedIds }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [touchStart, setTouchStart] = useState(0)
  const [touchDelta, setTouchDelta] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const current = images[index]

  const goPrev = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const goNext = useCallback(() => {
    setIndex((prev) => Math.min(images.length - 1, prev + 1))
  }, [images.length])

  // 键盘快捷键
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose, goPrev, goNext])

  // 阻止背景滚动
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  // 触摸手势
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
    setTouchDelta(0)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setTouchDelta(e.touches[0].clientX - touchStart)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (touchDelta > 50) goPrev()
    else if (touchDelta < -50) goNext()
    setTouchDelta(0)
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(current.url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = current.title || "image"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {}
  }

  const handleShare = async () => {
    try {
      const res = await fetch(current.url)
      const blob = await res.blob()
      const ext = current.url.split(".").pop()?.split("?")[0] || "jpeg"
      const file = new File([blob], `${current.title || "image"}.${ext}`, { type: blob.type })
      await navigator.share({ files: [file] })
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        handleDownload()
      }
    }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share && !!navigator.canShare

  if (!current) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 z-10">
        <span className="text-white/60 text-sm">
          {index + 1} / {images.length}
        </span>
        <button
          className="p-1 rounded-full text-white/70 hover:text-white transition-colors"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 图片区域 */}
      <div
        className="flex-1 flex items-center justify-center px-12"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imgRef}
          src={current.url}
          alt={current.title}
          className="max-w-full max-h-[80vh] object-contain select-none"
          style={{
            transform: `translateX(${touchDelta}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* 左箭头 */}
      {index > 0 && (
        <button
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); goPrev() }}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {/* 右箭头 */}
      {index < images.length - 1 && (
        <button
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); goNext() }}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* 底部工具栏 */}
      <div
        className="h-14 bg-black/80 flex items-center justify-center gap-8 flex-shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {canShare ? (
          <button
            className="text-white text-sm flex items-center gap-1.5 hover:text-violet-300 transition-colors"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
            分享
          </button>
        ) : (
          <button
            className="text-white text-sm flex items-center gap-1.5 hover:text-violet-300 transition-colors"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5" />
            下载
          </button>
        )}
        <button
          className="text-white text-sm flex items-center gap-1.5 hover:text-violet-300 transition-colors"
          onClick={handleDownload}
        >
          <Download className="w-5 h-5" />
          保存
        </button>
      </div>
    </div>
  )
}