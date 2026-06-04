"use client"

import { useState, useEffect } from "react"
import { Copy, Smartphone, Wifi, Zap, AlertCircle, Loader2, Camera, Sparkles, BookOpen, Truck, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const contentTypeMeta: Record<string, { label: string; icon: any; color: string }> = {
  factory_real: { label: "工厂实拍", icon: Users, color: "text-blue-600 bg-blue-50" },
  ai_render: { label: "AI效果图", icon: Sparkles, color: "text-violet-600 bg-violet-50" },
  knowledge: { label: "干货科普", icon: BookOpen, color: "text-amber-600 bg-amber-50" },
  shipping: { label: "发货展示", icon: Truck, color: "text-green-600 bg-green-50" },
}

const topicBank: Record<string, string[]> = {
  factory_real: [
    "铝单板从开料到出厂，到底要过几道关",
    "为什么别人的铝单板比你便宜一半——带你看生产线",
    "喷涂车间实拍：一块铝板如何变身高级外立面",
    "铝单板折边细节，90%的人不知道的门道",
    "工厂日常：今天发了3车铝单板，客户说终于找到源头厂",
    "铝单板焊接工艺，好与差的区别肉眼可见",
    "游标卡尺实测：标2.5mm的铝板到底有没有偷薄",
    "铝单板打磨环节，表面处理好不好全看这一步",
    "喷涂线运转中：氟碳喷涂为什么值这个价",
    "铝单板原材料对比：新料和回收料做出来的板差别多大",
  ],
  ai_render: [
    "这个颜色做别墅外墙，直接被邻居问爆",
    "2026年最火的5个铝单板颜色，你看中哪个",
    "甲方看了这个效果图，当场定板",
    "木纹铝单板装完的效果，比真木还好看",
    "商业综合体外墙选色，这3个颜色不会出错",
    "室内背景墙用铝单板，高级感拉满的搭配方案",
    "同一栋楼，不同颜色铝单板效果对比",
    "铝单板颜色怎么选？看完这组对比就懂了",
    "高端酒店外墙铝单板配色方案分享",
    "小户型别墅用这个颜色，邻居以为花了百万",
  ],
  knowledge: [
    "铝单板2.0mm和2.5mm差在哪？3张图讲清楚",
    "一张图看懂氟碳喷涂 vs 粉末喷涂",
    "铝单板报价单怎么看？收好这张表",
    "为什么有些铝单板用两年就褪色",
    "铝单板怎么选厚度？不是越厚越好",
    "铝单板价格差一倍，差在哪里",
    "铝单板安装验收，这5个点必须看",
    "铝单板保养方法，做对多用好几年",
    "铝单板常见质量问题，提前知道不踩坑",
    "铝单板合同怎么签？这些条款不能漏",
  ],
  shipping: [
    "今天发了5车铝单板，源头工厂不玩中间商",
    "铝单板打包有多讲究，打不好到了全是废板",
    "工厂排期紧张，提前一周定别卡着工期来",
    "木架打包实拍：一块板怎么安全送到工地",
    "铝单板发货前的最后一道检验",
    "今天客户说：找了3家终于找到不偷薄的厂",
    "铝单板装车现场，满满一车发往XX工地",
    "源头工厂的底气：库存充足，不用等调货",
    "铝单板排期表：现在定，下周五前能发货",
    "一批铝单板从车间到装车的全过程",
  ],
}

function getDailyTopics(count: number = 3): Array<{ type: string; topic: string }> {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const types = Object.keys(topicBank)
  const results: Array<{ type: string; topic: string }> = []

  for (let i = 0; i < count && i < types.length; i++) {
    const type = types[(seed + i) % types.length]
    const bank = topicBank[type]
    const idx = (seed + i * 7 + type.length) % bank.length
    results.push({ type, topic: bank[idx] })
  }
  return results
}

export default function Home() {
  const [localIp, setLocalIp] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [dailyTarget, setDailyTarget] = useState(1)
  const [autoEnabled, setAutoEnabled] = useState(true)
  const [taskAutoMsg, setTaskAutoMsg] = useState("")
  const [todayTopics, setTodayTopics] = useState<Array<{ type: string; topic: string }>>([])

  useEffect(() => {
    fetch("/api/local-ip").then((r) => r.json()).then((d) => setLocalIp(d.ip))
    fetch("/api/today-count").then((r) => r.json()).then((d) => setTodayCount(d.count ?? 0))

    const raw = localStorage.getItem("auto_gen_config")
    if (raw) {
      try {
        const cfg = JSON.parse(raw)
        setDailyTarget(cfg.dailyCount ?? 1)
        setAutoEnabled(cfg.enabled !== false)
      } catch {}
    }

    setTodayTopics(getDailyTopics(3))
    autoCheckAndCreateTasks()
  }, [])

  const accessUrl = localIp ? `http://${localIp}:${window.location.port || "3001"}` : ""

  useEffect(() => {
    autoCheckAndCreateTasks()
  }, [])

  const autoCheckAndCreateTasks = async () => {
    try {
      const res = await fetch("/api/tasks/generate", { method: "POST" })
      const data = await res.json()
      if (data.generated?.length > 0) {
        setTaskAutoMsg(`检测到素材缺口，已自动创建 ${data.generated.length} 个拍摄任务：${data.generated.join("、")}`)
      }
    } catch {}
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-xl md:text-2xl font-bold mb-2">欢迎使用小红书内容运营工具</h1>
      <p className="text-sm md:text-base text-muted-foreground mb-6">铝单板行业内容生产与运营管理平台</p>

      {taskAutoMsg && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-3 md:py-4">
            <div className="flex items-start gap-3">
              <Camera className="w-4 h-4 md:w-5 md:h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-semibold text-amber-800">拍摄任务已自动派发</p>
                <p className="text-xs md:text-sm text-amber-700 mt-1">{taskAutoMsg}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border-violet-200 bg-violet-50/50">
        <CardContent className="py-3 md:py-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <span className="text-sm md:text-base font-semibold text-violet-800">今日建议选题</span>
            <span className="text-xs text-violet-500 ml-auto">每天自动更新</span>
          </div>
          <div className="space-y-2">
            {todayTopics.map((t, i) => {
              const meta = contentTypeMeta[t.type] || contentTypeMeta.knowledge
              const Icon = meta.icon
              return (
                <button
                  key={i}
                  onClick={() => {
                    window.location.href = `/content?topic=${encodeURIComponent(t.topic)}&topicTitle=${encodeURIComponent(t.topic)}&topicContentType=${t.type}`
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-violet-50 transition-colors border border-transparent hover:border-violet-200"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${meta.color} flex items-center gap-1 shrink-0`}>
                      <Icon className="w-3 h-3" /> {meta.label}
                    </span>
                    <span className="text-sm font-medium text-gray-800 truncate">{t.topic}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {accessUrl && (
        <Card className="mb-6 border-violet-200 bg-violet-50">
          <CardContent className="py-3 md:py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <Wifi className="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs md:text-sm font-semibold text-violet-800">手机端访问</span>
                  <span className="text-xs text-violet-600">同 WiFi 下使用</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                  <code className="text-xs md:text-sm text-violet-700 flex-1 break-all">{accessUrl}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(accessUrl)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="shrink-0 p-1.5 rounded-md hover:bg-violet-100 transition-colors"
                  >
                    {copied ? (
                      <span className="text-xs text-green-600">已复制</span>
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-violet-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-2xl bg-card text-card-foreground shadow-lg p-4 md:p-6">
          <p className="text-xs md:text-sm text-muted-foreground mb-1">选题总数</p>
          <p className="text-2xl md:text-3xl font-bold">0</p>
        </div>
        <div className="rounded-2xl bg-card text-card-foreground shadow-lg p-4 md:p-6">
          <p className="text-xs md:text-sm text-muted-foreground mb-1">写作中</p>
          <p className="text-2xl md:text-3xl font-bold">0</p>
        </div>
        <div className="rounded-2xl bg-card text-card-foreground shadow-lg p-4 md:p-6">
          <p className="text-xs md:text-sm text-muted-foreground mb-1">已完成</p>
          <p className="text-2xl md:text-3xl font-bold">0</p>
        </div>
        <div className="rounded-2xl bg-card text-card-foreground shadow-lg p-4 md:p-6">
          <p className="text-xs md:text-sm text-muted-foreground mb-1">已发布</p>
          <p className="text-2xl md:text-3xl font-bold">0</p>
        </div>
      </div>
    </div>
  )
}
