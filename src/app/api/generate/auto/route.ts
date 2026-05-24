import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { callOpenRouterWithFallback } from "@/lib/openrouter"
import { builtInTemplates } from "@/data/prompt-templates"
import { renderPrompt } from "@/lib/prompt-engine"
import { renderRulesForPrompt, renderHookRules, getEnabledRules } from "@/data/content-rules"

const typeToTemplate: Record<string, string> = {
  factory_real: "auto-factory-real",
  ai_render: "auto-ai-render",
  knowledge: "auto-knowledge",
  shipping: "auto-shipping",
}

const typeToAssetTypes: Record<string, string[]> = {
  factory_real: ["production_line", "spray_line", "packing_shipping"],
  ai_render: ["ai_render"],
  knowledge: [],
  shipping: ["packing_shipping"],
}

function parseModels(raw: string): string[] {
  if (!raw) return []
  return raw.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean)
}

const IMAGE_PROMPT_SYSTEM = `你是一个AI图像提示词工程师。你的任务不是"套用模板"，而是根据文章的具体故事内容，描述出一个匹配这个故事的画面。

## 工作流程
1. 仔细阅读文章，提取具体的场景、人物动作、时间、地点、情绪
2. 用这些具体元素描述一张"刚好能配这篇文章"的照片
3. 画面应该让人一看就知道是这篇文章的图，不是通用的工厂照片

## 必须从文章中提取的要素
- **时间**：文章里提到"下午两点""凌晨"？用进去
- **人物状态**：文章提到某个人在干什么具体动作？用进去
- **具体物件**：文章里出现了什么具体的东西（机器名、工具名、材料名）？用进去
- **环境细节**：文章描述了什么环境（声音、温度、气味）？用进去
- **情绪氛围**：文章是什么语气（紧张/轻松/吐槽/感慨）？画面氛围要匹配

## 真实感关键词（选2-3个用）
- 手机/iPhone拍摄、轻微手持晃动、非专业构图
- 车间自然光/窗户侧光/阴天漫反射/白炽灯暖光、光线不均
- 真实纹理、金属反光、灰尘颗粒、焊接火花痕迹
- 背景有杂乱感、地面有金属碎屑、远处有模糊的设备
- 灰工作服、戴手套、面部不完美、低头干活的状态

## 反AI味（必须加入）
- 轻微过曝/暗角/噪点、非影棚拍摄、构图不完美、随手拍

## 禁用词（绝对不要出现）
- ❌ 商业摄影、高清、8K、完美光影、干净简洁、高质感、精致、大片、高级感

## 格式
纯中文描述，最后加 --ar 3:4
只输出提示词本身，不要加任何解释。

## 好例子（贴合具体故事）
下午两点车间里闷热，穿灰色工装的中年师傅弯着腰在一台液压折弯机前仔细摸一块刚折好的铝板表面，手指上戴着白色工作手套，机器旁边的台面上堆着几张没折的铝板，车间从侧面窗户透进来的光线不均匀，地上有零散的铝屑，iPhone随手拍的车间日常 --ar 3:4

## 坏例子（就是套模板，跟文章完全没关系）
工厂车间场景，为什么有些铝板摸起来就是不一样，工人在操作设备，自然光透过车间窗户，工业纪实摄影风格 --ar 3:4`

export async function POST(request: Request) {
  const { contentType, model, scheduleDate } = await request.json()
  const apiKey = request.headers.get("x-api-key") || ""
  const models = parseModels(model)

  if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 400 })
  if (models.length === 0) return NextResponse.json({ error: "模型列表为空" }, { status: 400 })

  const templateId = typeToTemplate[contentType] || "auto-knowledge"
  const template = builtInTemplates.find((t) => t.id === templateId)
  if (!template) return NextResponse.json({ error: "模板不存在" }, { status: 400 })

  const factoryRealTopics = [
    "车间里最容易被忽略的一个环节",
    "一块铝板从铝锭到出厂的全过程",
    "怎么判断一家铝板厂靠不靠谱",
    "折边这道工序，机器和人的差距在哪",
    "为什么有些铝板摸起来就是不一样",
  ]
  const aiRenderTopics = [
    "今年选铝板最火的几个颜色",
    "同样一栋楼，不同颜色铝板效果差多少",
    "幕墙铝板的颜色搭配避坑",
    "室内装修用铝板，效果出乎意料",
    "客户最常问的颜色推荐",
  ]
  const knowledgeTopics = [
    "铝单板厚度到底选多少合适",
    "氟碳喷涂和粉末喷涂到底怎么选",
    "铝板安装最容易出问题的地方",
    "铝单板价格到底贵在哪",
    "铝板幕墙的日常维护和寿命",
  ]
  const shippingTopics = [
    "一车铝板怎么安全送到工地",
    "发货打包你不知道的细节",
    "物流运输中铝板最容易出现的问题",
    "为什么交期总是比想象的长",
    "不同地区的发货怎么安排",
  ]

  const productionSteps = [
    "开料→折边→焊接→打磨→喷涂",
    "钣金加工：从图纸到成型",
    "喷涂环节：调色→上件→喷涂→烘烤→下件",
    "质检环节：逐件检查尺寸和表面",
    "包装：木架打包→防雨膜→装车",
  ]
  const colorProcesses = [
    "氟碳喷涂 金属色系",
    "木纹转印 仿木效果",
    "石纹效果 仿石材",
    "粉末喷涂 纯色系列",
    "拉丝处理 金属质感",
  ]
  const scenarios = [
    "商场中庭、写字楼大堂",
    "酒店外墙、售楼处",
    "机场航站楼、高铁站",
    "医院走廊、学校教学楼",
    "室内背景墙、天花吊顶",
  ]
  const knowledgePoints = [
    "厚度选择：2.0/2.5/3.0的适用场景和鉴别方法",
    "表面处理：氟碳vs粉末的耐候性对比和价格差异",
    "安装规范：龙骨间距、密封胶选用、排水设计",
    "价格构成：材料费+加工费+表面处理+包装运输的各自占比",
    "行业套路：以薄充厚、以粉末充氟碳的辨别方法",
  ]
  const shippingDetails = [
    "木架打包+专线发货+货损责任",
    "包装流程：检查→包角→木架→防雨→装车",
    "长途运输的固定和保护措施",
    "不同地区的物流选择和时效对比",
    "货损处理和保险理赔流程",
  ]

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  const formValues: Record<string, string> = {
    选题: contentType === "factory_real" ? pick(factoryRealTopics) :
         contentType === "ai_render" ? pick(aiRenderTopics) :
         contentType === "knowledge" ? pick(knowledgeTopics) :
         pick(shippingTopics),
    生产环节: pick(productionSteps),
    颜色工艺: pick(colorProcesses),
    推荐场景: pick(scenarios),
    知识要点: pick(knowledgePoints),
    发货内容: pick(shippingDetails),
    emoji数量: String(Math.floor(Math.random() * 3) + 2),
    标签数量: String(Math.floor(Math.random() * 3) + 4),
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "XHS Content Tool",
    },
  })

  try {
    const assetTypes = typeToAssetTypes[contentType] || []
    let images = ""

    if (contentType === "knowledge") {
      const assets = await prisma.asset.findMany({
        where: { isFatigued: false },
        take: 1,
        orderBy: { usageCount: "asc" },
      })
      images = assets.map((a) => a.url).join(",")
    } else if (assetTypes.length > 0) {
      const assets = await prisma.asset.findMany({
        where: { type: { in: assetTypes }, isFatigued: false },
        orderBy: { usageCount: "asc" },
        take: contentType === "factory_real" ? 9 : 6,
      })
      images = assets.map((a) => a.url).join(",")

      if (images) {
        await prisma.asset.updateMany({
          where: { url: { in: assets.map((a) => a.url) } },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
        })
      }
    }

    const prompt = renderPrompt(template.content, formValues)
    const rulesSection = renderRulesForPrompt(contentType)
    const finalPrompt = prompt + rulesSection
    const result = await callOpenRouterWithFallback(openai, models, finalPrompt)

    const body = result.content

    // 注入话术钩子（社交货币规则）
    const hookSection = renderHookRules(contentType)
    const finalBody = body + hookSection

    let imagePrompt = ""
    const imgModels = [
      "anthropic/claude-3.5-sonnet",
      "deepseek/deepseek-chat",
      "qwen/qwen-plus",
    ]
    for (let attempt = 0; attempt < imgModels.length; attempt++) {
      try {
        const m = imgModels[attempt]
        const imgPromptResult = await openai.chat.completions.create({
          model: m,
          messages: [
            { role: "system", content: IMAGE_PROMPT_SYSTEM },
            { role: "user", content: `内容类型：${contentType}\n正文标题：${formValues["选题"]}\n正文内容（仔细阅读，提取具体故事细节）：${result.content.slice(0, 500)}` },
          ],
          temperature: 0.7,
          max_tokens: 500,
        })
        imagePrompt = imgPromptResult.choices[0]?.message?.content || ""
        imagePrompt = imagePrompt.replace(/```[\s\S]*?\n?/g, "").trim()
        if (imagePrompt) break
      } catch (e: any) {
        const msg = e?.message || ""
        if (msg.includes("429") || msg.includes("rate")) {
          const delay = (attempt + 1) * 2000
          console.log(`[image-prompt] rate limited, retry after ${delay}ms`)
          await new Promise(r => setTimeout(r, delay))
          continue
        }
        console.error("[image-prompt] model failed, trying next:", msg)
      }
    }

    const content = await prisma.content.create({
      data: {
        title: formValues["选题"],
        body: finalBody,
        contentType,
        images,
        tags: contentType,
        imagePrompt,
      },
    })

    if (scheduleDate) {
      await prisma.calendarEntry.create({
        data: { contentId: content.id, date: scheduleDate },
      })
    }

    return NextResponse.json({ content: finalBody, body: finalBody, contentType, images, id: content.id, imagePrompt })
  } catch (err: any) {
    console.error("[auto-generate] ERROR:", err?.message)
    return NextResponse.json({ error: err?.message || "自动生成失败" }, { status: 500 })
  }
}