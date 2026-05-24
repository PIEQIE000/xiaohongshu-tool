import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { parseModelsWithFallback } from "@/lib/model-try"

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key") || ""

    const [topics, assets, strategies, metrics] = await Promise.all([
      prisma.topic.findMany({ select: { title: true, tags: true } }),
      prisma.asset.findMany({ select: { type: true }, where: { isFatigued: false } }),
      prisma.contentStrategy.findMany(),
      prisma.metric.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          likes: true, collects: true, comments: true, views: true,
          content: { select: { title: true, contentType: true, tags: true } },
        },
      }),
    ])

    const existingTopics = topics.map(t => t.title).join("、")
    const assetCoverage: Record<string, number> = {}
    for (const a of assets) {
      assetCoverage[a.type] = (assetCoverage[a.type] || 0) + 1
    }

    const strategyConfig: Record<string, any> = {}
    for (const s of strategies) {
      try { strategyConfig[s.key] = JSON.parse(s.value) } catch { strategyConfig[s.key] = s.value }
    }

    const topTitles = metrics
      .filter(m => m.content?.title)
      .sort((a, b) => ((b.likes + b.collects) / Math.max(b.views, 1)) - ((a.likes + a.collects) / Math.max(a.views, 1)))
      .slice(0, 5)
      .map(m => `${m.content!.title}(互动率:${((m.likes + m.collects) / Math.max(m.views, 1) * 100).toFixed(1)}%)`)
      .join("、")

    const prompt = `你是一个铝单板工厂小红书账号的内容策略师。请根据以下信息，推荐5个新选题。每个选题必须包含：标题、建议内容类型、推荐角度（反差切入点）、为什么这个选题会有效。

## 已有选题（不要重复）
${existingTopics || "暂无"}

## 素材库覆盖情况
${Object.entries(assetCoverage).map(([t, c]) => `${t}: ${c}张`).join("、")}

## 高互动内容参考
${topTitles || "暂无数据"}

## 要求
1. 每个选题标题必须有"情理之中、预料之外"的反差
2. 内容类型从：factory_real(工厂实拍)、ai_render(AI效果图)、knowledge(干货科普)、shipping(发货展示) 中选
3. 角度要具体，不能是"展示工厂实力"这种空话
4. 优先推荐素材覆盖率高的类型对应的选题
5. 输出纯JSON数组，格式：
[
  {"title": "选题标题", "contentType": "factory_real", "angle": "反差切入角度", "reason": "为什么有效", "tags": "铝单板,标签1,标签2"},
  ...
]`

    if (!apiKey) {
      return NextResponse.json(generateFallbackTopics(assetCoverage))
    }

    const models = parseModelsWithFallback(request.headers.get("x-models"))

    for (const m of models) {
      try {
        const openai = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey,
          defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "XHS Content Tool",
          },
        })

        const completion = await openai.chat.completions.create({
          model: m,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
          response_format: { type: "json_object" },
        })

        const raw = completion.choices[0]?.message?.content || ""
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        const parsed = JSON.parse(cleaned)
        const suggestions = Array.isArray(parsed) ? parsed : (parsed.topics || parsed.suggestions || [])
        if (suggestions.length > 0) {
          return NextResponse.json(suggestions)
        }
        console.log("[topics/suggest] Model", m, "returned empty, trying next")
      } catch (e: any) {
        const msg = e?.message || ""
        console.log("[topics/suggest] Model", m, "failed:", msg.slice(0, 100))
        if (msg.includes("429") || msg.includes("rate")) {
          await new Promise(r => setTimeout(r, 2000))
        }
      }
    }

    return NextResponse.json(generateFallbackTopics(assetCoverage))
  } catch (err: any) {
    console.error("[topics/suggest] ERROR:", err?.message)
    return NextResponse.json(generateFallbackTopics({}))
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateFallbackTopics(coverage: Record<string, number>): Array<{ title: string; contentType: string; angle: string; reason: string; tags: string }> {
  const all: Array<{ title: string; contentType: string; angle: string; reason: string; tags: string }> = [
    { title: "游标卡尺实测：市面上2.5mm的铝板实际有多厚", contentType: "knowledge", angle: "用实测数据揭露行业真相", reason: "数据反差制造信任，科普+避坑双重吸引", tags: "铝单板,避坑指南,行业真相" },
    { title: "我在喷涂车间待了一下午，回家咳了一晚上", contentType: "factory_real", angle: "不用美化车间环境，写真实代价", reason: "真实感比摆拍强100倍，弱者视角引发共鸣", tags: "铝单板,工厂实拍,源头厂家" },
    { title: "做了32个色板，最后90%客户只选了这3个颜色", contentType: "ai_render", angle: "选择过程本身就是内容，帮客户做筛选", reason: "数据+筛选=价值，省去客户决策成本", tags: "铝单板,效果图,颜色推荐" },
    { title: "为什么同样厚度的铝板价格差一倍？拆给你看", contentType: "knowledge", angle: "拆解成本结构，透明定价建立信任", reason: "价格是客户最关心的问题，直接回应", tags: "铝单板,价格,干货" },
    { title: "这车货值20万，司机压坏了3块我赔了2000", contentType: "shipping", angle: "不炫耀订单多，写翻车故事", reason: "翻车=真实，比满满订单更有说服力", tags: "铝单板,发货,工厂日常" },
    { title: "安装师傅最怕的3种铝板设计（设计师请听我说）", contentType: "knowledge", angle: "从施工角度反向吐槽设计", reason: "制造对立引发传播，安装师傅会帮你转发", tags: "铝单板,安装,设计师" },
    { title: "这栋写字楼3年前装的铝板，我专门去拍了张对比照", contentType: "ai_render", angle: "有时间纵深的实际案例，不只效果图", reason: "长期效果比刚装上的效果图更有说服力", tags: "铝单板,幕墙,实际案例" },
    { title: "一块铝板的成本账：铝锭→喷涂→人工→运费各自占多少", contentType: "knowledge", angle: "透明化定价，让客户知道钱花在哪", reason: "打破信息不对称=建立信任", tags: "铝单板,成本,透明定价" },
    { title: "车间师傅偷偷告诉我：这种订单我们最不想接", contentType: "factory_real", angle: "内部人员视角，揭露不情愿但必须做的事", reason: "好奇+内部视角=高互动，客户想知道自己是不是难搞客户", tags: "铝单板,工厂日常,内幕" },
    { title: "同一台折弯机，为什么老师傅折出来就是不一样", contentType: "factory_real", angle: "手艺人的不可替代性", reason: "尊重手艺+制造悬念，引发评论区讨论", tags: "铝单板,折弯,工匠精神" },
    { title: "客户寄来一张皱巴巴的手绘图纸，我们居然做出来了", contentType: "shipping", angle: "奇葩需求也能接", reason: "展示柔性服务能力，同时故事性强", tags: "铝单板,定制,奇葩需求" },
    { title: "铝板喷涂前这道工序，90%的厂家会省掉", contentType: "knowledge", angle: "揭露行业潜规则，帮客户避坑", reason: "恐惧+好奇=高点击，帮客户省钱的心理", tags: "铝单板,喷涂,避坑" },
  ]
  return shuffleArray(all).slice(0, 5)
}