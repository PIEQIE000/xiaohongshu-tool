"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [modelIds, setModelIds] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedKey = localStorage.getItem("openrouter_api_key") || ""
    const savedModels = localStorage.getItem("openrouter_model") || ""
    setApiKey(savedKey)
    setModelIds(savedModels)
  }, [])

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">设置</h1>

      <div className="space-y-6">
        <Card>
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold mb-4">OpenRouter API Key</h2>
            <p className="text-sm text-muted-foreground mb-4">
              输入你的 OpenRouter API Key，用于 AI 文案生成。密钥仅存储在本地。
            </p>
            <Input
              type="password"
              placeholder="sk-or-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                localStorage.setItem("openrouter_api_key", e.target.value)
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
              }}
            />
            {saved && (
              <p className="text-sm text-green-600 mt-2">保存成功！</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" /> AI 模型列表
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              每行一个模型 ID，从上到下优先级递减。调用时自动按顺序尝试，第一个可用的模型将被使用。
            </p>
            <textarea
              className="w-full min-h-[180px] rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
              placeholder={`deepseek/deepseek-v4-flash:free\nnvidia/nemotron-3-super-120b-a12b:free\npoolside/laguna-m.1:free`}
              value={modelIds}
              onChange={(e) => {
                setModelIds(e.target.value)
                localStorage.setItem("openrouter_model", e.target.value)
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              在 <a href="https://openrouter.ai/models?max_price=0" target="_blank" className="text-violet-600 underline">OpenRouter Models</a> 页面找到免费模型，复制完整 ID 填入
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
