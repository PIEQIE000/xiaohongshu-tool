"use client"

import { useState, useEffect } from "react"
import { use } from "react"

type Asset = {
  id: string
  type: string
  url: string
  title: string
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [assets, setAssets] = useState<Asset[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/assets/share/${token}`)
      .then(async (r) => {
        const data = await r.json()
        if (data.error) {
          setError(data.error)
        } else if (Array.isArray(data.assets)) {
          setAssets(data.assets)
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">{error}</p>
          <p className="text-gray-400 text-sm">链接可能已过期或失效</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-lg font-bold text-center mb-4">
        铝单板工厂 · 图片分享 ({assets.length} 张)
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {assets.map((asset) => (
          <a
            key={asset.id}
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl overflow-hidden bg-white shadow-sm active:scale-95 transition-transform"
          >
            <img src={asset.url} alt={asset.title} className="w-full aspect-square object-cover" />
          </a>
        ))}
      </div>
    </div>
  )
}
