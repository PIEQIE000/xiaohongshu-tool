"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Eye, Zap } from "lucide-react"
import { UserManagement } from "@/components/UserManagement"

const DEFAULT_RATIOS = { factory_real: 30, ai_render: 30, knowledge: 25, shipping: 15 }
const DEFAULT_HOURS = "12, 18, 21"

const contentTypeLabels: Record<string, string> = {
  factory_real: "工厂实拍",
  ai_render: "AI效果图",
  knowledge: "干货科普",
  shipping: "发货展示",
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [modelIds, setModelIds] = useState("")
  const [visionModel, setVisionModel] = useState("")
  const [saved, setSaved] = useState(false)

  const [autoEnabled, setAutoEnabled] = useState(true)
  const [dailyCount, setDailyCount] = useState(1)
  const [ratios, setRatios] = useState(DEFAULT_RATIOS)
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [fatigueThreshold, setFatigueThreshold] = useState(3)

  useEffect(() => {
    setApiKey(localStorage.getItem("openrouter_api_key") || "")
    setModelIds(localStorage.getItem("openrouter_model") || "")
    setVisionModel(localStorage.getItem("openrouter_vision_model") || "")

    const raw = localStorage.getItem("auto_gen_config")
    if (raw) {
      try {
        const cfg = JSON.parse(raw)
        setAutoEnabled(cfg.enabled !== false)
        setDailyCount(cfg.dailyCount ?? 1)
        setRatios(cfg.contentTypeRatios ?? DEFAULT_RATIOS)
        setHours((cfg.preferredHours || DEFAULT_HOURS).join?.(", ") ?? cfg.preferredHours ?? DEFAULT_HOURS)
        setFatigueThreshold(cfg.fatigueThreshold ?? 3)
      } catch {}
    }
  }, [])

  const saveAutoConfig = () => {
    const hoursList = hours.split(/[,，]+/).map((h) => parseInt(h.trim())).filter((h) => !isNaN(h) && h >= 0 && h <= 23)
    const config = {
      enabled: autoEnabled,
      dailyCount: dailyCount || 1,
      contentTypeRatios: ratios,
      preferredHours: hoursList.length > 0 ? hoursList : [12, 18, 21],
      fatigueThreshold: fatigueThreshold || 3,
    }
    localStorage.setItem("auto_gen_config", JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const ratioTypes: Array<{ key: string; color: string }> = [
    { key: "factory_real", color: "bg-blue-500" },
    { key: "ai_render", color: "bg-purple-500" },
    { key: "knowledge", color: "bg-green-500" },
    { key: "shipping", color: "bg-orange-500" },
  ]

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

        <Card>
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-violet-600" /> 视觉模型（AI 图片分类）
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              用于素材库 AI 图片识别分类。必须使用支持图片输入的多模态模型。
              不填则自动发现当前可用的免费视觉模型，5 分钟刷新一次。
            </p>
            <Input
              placeholder="不填则自动发现"
              value={visionModel}
              onChange={(e) => {
                setVisionModel(e.target.value)
                localStorage.setItem("openrouter_vision_model", e.target.value)
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              推荐免费可用的视觉模型：<br />
              nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free<br />
              google/gemma-4-31b-it:free<br />
              google/gemma-4-26b-a4b-it:free<br />
              在 <a href="https://openrouter.ai/models?max_price=0" target="_blank" className="text-violet-600 underline">OpenRouter Models</a> 筛选「支持图片」查找更多
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-600" /> 自动生成配置
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              配置每日自动生成内容的规则，系统会根据设定自动选择内容类型和素材。
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">开关</label>
                <button
                  onClick={() => { setAutoEnabled(!autoEnabled); saveAutoConfig() }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${autoEnabled ? "bg-violet-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoEnabled ? "translate-x-5" : ""}`} />
                </button>
                <span className="text-xs text-muted-foreground">{autoEnabled ? "已开启" : "已关闭"}</span>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">每日生成数量</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={dailyCount}
                  onChange={(e) => setDailyCount(parseInt(e.target.value) || 1)}
                  className="w-32"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">内容类型配比（合计需 100）</label>
                <div className="space-y-3">
                  {ratioTypes.map((t) => (
                    <div key={t.key} className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.color}`} />
                      <span className="text-sm w-20 shrink-0">{contentTypeLabels[t.key]}</span>
                      <input
                        type="range"
                        min={0}
                        max={80}
                        value={ratios[t.key as keyof typeof ratios]}
                        onChange={(e) => setRatios({ ...ratios, [t.key]: parseInt(e.target.value) })}
                        className="flex-1 h-2 accent-violet-600"
                      />
                      <span className="text-sm w-12 text-right">{ratios[t.key as keyof typeof ratios]}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  当前合计：{Object.values(ratios).reduce((a, b) => a + b, 0)}%
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">发布时段（逗号分隔，24 小时制）</label>
                <Input
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="12, 18, 21"
                  className="w-40"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">素材疲劳阈值（使用 N 次后标记疲劳）</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={fatigueThreshold}
                  onChange={(e) => setFatigueThreshold(parseInt(e.target.value) || 3)}
                  className="w-32"
                />
              </div>

              <Button onClick={saveAutoConfig} size="sm">
                保存配置
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <UserManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
