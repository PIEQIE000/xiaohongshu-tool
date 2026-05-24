"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Save, RotateCcw, Plus, Trash2, GripVertical } from "lucide-react"
import { Alert } from "@/components/Alert"

type Tab = "angles" | "titles" | "hooks" | "language" | "redlines"

interface AngleEntry {
  bad: string
  good: string
  reason: string
}

interface TitleTemplate {
  formula: string
  example: string
  for: string
}

interface HookEntry {
  scene: string
  text: string
}

interface LanguageRule {
  ok: string
  notOk: string
}

const defaultAngles: Record<string, AngleEntry[]> = {
  factory_real: [
    { bad: "工厂实拍：我们的生产线", good: "一块铝板的72小时：从铝锭到你墙上", reason: "有叙事弧线" },
    { bad: "源头工厂，价格实惠", good: "我算了一笔账：铝板价格里，材料费只占40%", reason: "用数据制造意外" },
    { bad: "开料→折边→焊接→打磨→喷涂", good: "这家工厂最吵的不是机器，是质检员", reason: "人物角度，有温度" },
    { bad: "氟碳喷涂车间实拍", good: "喷涂师傅说：你这颜色我调了3次才满意", reason: "具体的人和事" },
    { bad: "车间整洁，管理规范", good: "昨天一块板子返工3次，我差点跟焊工打起来", reason: "真实冲突" },
  ],
  ai_render: [
    { bad: "这种颜色的铝板真好看", good: "这栋楼用了我们的铝板，3年后我专门去拍了张照", reason: "有时间纵深" },
    { bad: "多种颜色可选", good: "客户选了32个颜色，只有这个颜色卖得最好", reason: "数据+筛选=价值" },
    { bad: "铝板外墙效果图", good: "同样一栋楼，用铝板vs用涂料，5年后差距有多大", reason: "对比制造反差" },
    { bad: "推荐这种颜色搭配", good: "最不建议选的3种铝板颜色（别问我怎么知道的）", reason: "避坑=信任" },
  ],
  knowledge: [
    { bad: "铝单板厚度怎么选", good: "游标卡尺测给你看：市面上标2.5mm的板，实际只有2.0", reason: "揭露真相=爆点" },
    { bad: "铝单板安装注意事项", good: "安装师傅最恨的3种铝板设计（设计师请进来挨打）", reason: "冲突=传播" },
    { bad: "氟碳喷涂vs粉末喷涂", good: "我拿打火机烧了3块不同的板子，结果出乎意料", reason: "实验=可信" },
    { bad: "铝单板价格组成", good: "一块300块的铝板，运费可能要100", reason: "意外信息点" },
  ],
  shipping: [
    { bad: "今日发货，满满的订单", good: "这车货值20万，但司机压坏了3块我赔了2000", reason: "翻车=真实" },
    { bad: "木架打包，专线发货", good: "为什么我坚持用木架？因为泡沫打包的亏我吃过", reason: "个人经历=信任" },
    { bad: "源头工厂，排期紧张", good: "这周接了8个工地，能按时交货的只有5个", reason: "选择性=真实性" },
  ],
}

const defaultTitles: TitleTemplate[] = [
  { formula: "数字+反常识", example: "铝板行业没人敢说的5个秘密", for: "科普" },
  { formula: "对比式", example: "同一栋楼，铝板vs真石漆，3年后变这样", for: "效果图" },
  { formula: "幕后故事", example: "一块铝板从车间到你墙上，经历了什么", for: "工厂实拍" },
  { formula: "避坑式", example: "选铝板最容易踩的3个坑，第2个90%人中招", for: "科普" },
  { formula: "揭秘式", example: "游标卡尺测给你看，你买的铝板真的够厚吗", for: "科普" },
  { formula: "第一人称", example: "我做铝板5年，这3种颜色真的不建议选", for: "效果图" },
]

const defaultHooks: HookEntry[] = [
  { scene: "科普类", text: "有问题直接问，我可能比设计师更懂铝板" },
  { scene: "工厂类", text: "想来看车间？随时来，不用预约" },
  { scene: "效果图", text: "图纸发我，免费帮你配色选板" },
  { scene: "发货类", text: "工期排到这周末了，急单提前说" },
]

const defaultLanguage: LanguageRule[] = [
  { ok: "我们车间 / 我师傅", notOk: "我司 / 本公司" },
  { ok: "说实话 / 坦白讲", notOk: "保证 / 绝对 / 100%" },
  { ok: "我试过 / 我踩过坑", notOk: "经过研究 / 据分析" },
  { ok: "大概 / 差不多", notOk: "精准 / 严谨" },
  { ok: "具体的数字和故事", notOk: "形容词堆砌（高品质/卓越/一流）" },
]

const defaultRedlines: string[] = [
  "不懂的工艺不要编造——不知道就说不知道",
  "不贬低具体同行——可以说自己怎么做，不说别人怎么烂",
  "不碰敏感话题——不聊政治、社会对立、地域歧视",
  `不制造焦虑——不写"再不买就涨价了""限时"等套路`,
  `承认局限性——比如"我们确实做不了某些特殊工艺"`,
]

const contentTypeLabels: Record<string, string> = {
  factory_real: "工厂实拍",
  ai_render: "AI效果图",
  knowledge: "干货科普",
  shipping: "发货展示",
}

export default function ContentStrategyPage() {
  const [activeTab, setActiveTab] = useState<Tab>("angles")
  const [angleType, setAngleType] = useState("factory_real")
  const [angles, setAngles] = useState<Record<string, AngleEntry[]>>(defaultAngles)
  const [titles, setTitles] = useState<TitleTemplate[]>(defaultTitles)
  const [hooks, setHooks] = useState<HookEntry[]>(defaultHooks)
  const [language, setLanguage] = useState<LanguageRule[]>(defaultLanguage)
  const [redlines, setRedlines] = useState<string[]>(defaultRedlines)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/content-strategy")
      .then(r => r.json())
      .then(data => {
        if (data.angles) setAngles(data.angles)
        if (data.titles) setTitles(data.titles)
        if (data.hooks) setHooks(data.hooks)
        if (data.language) setLanguage(data.language)
        if (data.redlines) setRedlines(data.redlines)
      })
      .catch(() => {})
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/content-strategy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angles, titles, hooks, language, redlines }),
      })
      if (res.ok) setMessage("已保存")
      else setMessage("保存失败")
    } catch { setMessage("保存失败") }
    finally { setTimeout(() => setMessage(""), 2000); setSaving(false) }
  }, [angles, titles, hooks, language, redlines])

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "angles", label: "角度库" },
    { key: "titles", label: "标题模板" },
    { key: "hooks", label: "话术钩子" },
    { key: "language", label: "语言规则" },
    { key: "redlines", label: "红线清单" },
  ]

  const updateAngle = (type: string, index: number, field: keyof AngleEntry, value: string) => {
    setAngles(prev => {
      const copy = { ...prev }
      copy[type] = [...(copy[type] || [])]
      copy[type][index] = { ...copy[type][index], [field]: value }
      return copy
    })
  }

  const addAngle = (type: string) => {
    setAngles(prev => {
      const copy = { ...prev }
      copy[type] = [...(copy[type] || []), { bad: "", good: "", reason: "" }]
      return copy
    })
  }

  const removeAngle = (type: string, index: number) => {
    setAngles(prev => {
      const copy = { ...prev }
      copy[type] = copy[type].filter((_, i) => i !== index)
      return copy
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">内容策略管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理角度库、标题模板、话术规则，控制AI生成方向</p>
        </div>
        <Button onClick={save} disabled={saving} size="sm">
          <Save className="w-4 h-4 mr-1" />{saving ? "保存中..." : "保存"}
        </Button>
      </div>
      {message && <Alert message={message} />}

      <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4 w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm transition-all ${
              activeTab === t.key ? "bg-white shadow-sm font-medium" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "angles" && (
        <div className="space-y-4">
          <div className="flex bg-gray-100 rounded-lg p-0.5 w-fit mb-3">
            {Object.entries(contentTypeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setAngleType(key)}
                className={`px-3 py-1 rounded-md text-xs transition-all ${
                  angleType === key ? "bg-white shadow-sm font-medium" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="py-4">
              <div className="text-xs text-muted-foreground mb-3">
                为「{contentTypeLabels[angleType]}」配置角度对照：平庸角度 → 反差角度
              </div>
              <div className="space-y-3">
                {(angles[angleType] || []).map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-50 group">
                    <GripVertical className="w-4 h-4 mt-2.5 text-gray-300 shrink-0" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      <div>
                        <label className="text-[10px] text-muted-foreground">平庸角度（不写）</label>
                        <Input value={entry.bad} onChange={e => updateAngle(angleType, i, "bad", e.target.value)} className="h-8 text-xs" placeholder="比如：工厂实拍展示" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">反差角度（写这个）</label>
                        <Input value={entry.good} onChange={e => updateAngle(angleType, i, "good", e.target.value)} className="h-8 text-xs" placeholder="比如：一块铝板的72小时" />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground">理由</label>
                          <Input value={entry.reason} onChange={e => updateAngle(angleType, i, "reason", e.target.value)} className="h-8 text-xs" placeholder="为什么更好" />
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-400 h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => removeAngle(angleType, i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => addAngle(angleType)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> 添加角度
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "titles" && (
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground mb-3">标题公式模板，每条含公式名、示例、适用类型</div>
            <div className="space-y-2">
              {titles.map((t, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-gray-50 group">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                    <Input value={t.formula} onChange={e => setTitles(prev => { const cp = [...prev]; cp[i] = { ...cp[i], formula: e.target.value }; return cp })} className="h-8 text-xs" placeholder="公式名" />
                    <Input value={t.example} onChange={e => setTitles(prev => { const cp = [...prev]; cp[i] = { ...cp[i], example: e.target.value }; return cp })} className="h-8 text-xs" placeholder="示例标题" />
                    <div className="flex items-end gap-2">
                      <Input value={t.for} onChange={e => setTitles(prev => { const cp = [...prev]; cp[i] = { ...cp[i], for: e.target.value }; return cp })} className="h-8 text-xs flex-1" placeholder="适用类型" />
                      <Button variant="ghost" size="sm" className="text-red-400 h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => setTitles(prev => prev.filter((_, j) => j !== i))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setTitles(prev => [...prev, { formula: "", example: "", for: "" }])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> 添加模板
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "hooks" && (
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground mb-3">结尾话术钩子，按场景分类，每条不超过20字</div>
            <div className="space-y-2">
              {hooks.map((h, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-gray-50 group">
                  <Input value={h.scene} onChange={e => setHooks(prev => { const cp = [...prev]; cp[i] = { ...cp[i], scene: e.target.value }; return cp })} className="h-8 text-xs w-28" placeholder="场景" />
                  <Input value={h.text} onChange={e => setHooks(prev => { const cp = [...prev]; cp[i] = { ...cp[i], text: e.target.value }; return cp })} className="h-8 text-xs flex-1" placeholder="话术内容" />
                  <Button variant="ghost" size="sm" className="text-red-400 h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => setHooks(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setHooks(prev => [...prev, { scene: "", text: "" }])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> 添加话术
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "language" && (
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground mb-3">用语规范对照表：左边可以说，右边不能说</div>
            <div className="space-y-2">
              {language.map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-gray-50 group">
                  <Input value={r.ok} onChange={e => setLanguage(prev => { const cp = [...prev]; cp[i] = { ...cp[i], ok: e.target.value }; return cp })} className="h-8 text-xs flex-1 border-green-200" placeholder="可以说" />
                  <span className="text-gray-300 shrink-0">→</span>
                  <Input value={r.notOk} onChange={e => setLanguage(prev => { const cp = [...prev]; cp[i] = { ...cp[i], notOk: e.target.value }; return cp })} className="h-8 text-xs flex-1 border-red-200" placeholder="不能说" />
                  <Button variant="ghost" size="sm" className="text-red-400 h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => setLanguage(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setLanguage(prev => [...prev, { ok: "", notOk: "" }])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> 添加规则
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "redlines" && (
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground mb-3">内容红线，AI 审核时逐条检查，违反任一条直接扣分</div>
            <div className="space-y-2">
              {redlines.map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-red-50 group">
                  <span className="w-5 h-5 rounded-full bg-red-200 text-red-700 flex items-center justify-center text-xs shrink-0">{i + 1}</span>
                  <Input value={r} onChange={e => setRedlines(prev => { const cp = [...prev]; cp[i] = e.target.value; return cp })} className="h-8 text-sm flex-1 border-red-200 bg-white" />
                  <Button variant="ghost" size="sm" className="text-red-400 h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => setRedlines(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setRedlines(prev => [...prev, ""])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> 添加红线
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}