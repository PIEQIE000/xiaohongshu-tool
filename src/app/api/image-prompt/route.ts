import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { parseModelsWithFallback } from "@/lib/model-try"

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

## 坏例子（就是你现在在做的）
工厂车间场景，为什么有些铝板摸起来就是不一样，工人在操作设备，自然光透过车间窗户，工业纪实摄影风格 --ar 3:4
（这种就是套模板，跟文章完全没关系）`

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key") || ""
  if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 400 })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 })
  }

  const contentId = body.contentId
  if (!contentId) return NextResponse.json({ error: "缺少 contentId" }, { status: 400 })

  console.log("[image-prompt] Generating for content:", contentId)

  const content = await prisma.content.findUnique({ where: { id: contentId } })
  if (!content) return NextResponse.json({ error: "内容不存在" }, { status: 404 })

  const title = content.title || "铝单板内容"
  const textBody = content.body || ""
  const contentType = content.contentType || "factory_real"

  console.log("[image-prompt] type:", contentType, "title:", title.slice(0, 30))

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "XHS Content Tool",
    },
  })

  let imagePrompt = ""
  const models = parseModelsWithFallback(request.headers.get("x-models"))
  for (let attempt = 0; attempt < models.length; attempt++) {
    try {
      const m = models[attempt]
      console.log("[image-prompt] Attempt", attempt + 1, "model:", m)
      const result = await openai.chat.completions.create({
        model: m,
        messages: [
          { role: "system", content: IMAGE_PROMPT_SYSTEM },
          { role: "user", content: `内容类型：${contentType}\n正文标题：${title}\n正文内容（仔细阅读，提取具体故事细节）：${textBody.slice(0, 500)}` },
        ],
        temperature: 0.7,
        max_tokens: 500,
      })
      imagePrompt = result.choices[0]?.message?.content || ""
      imagePrompt = imagePrompt.replace(/```[\s\S]*?\n?/g, "").trim()
      console.log("[image-prompt] Generated:", imagePrompt.slice(0, 80))
      if (imagePrompt) break
    } catch (e: any) {
      const msg = e?.message || ""
      console.log("[image-prompt] API error:", msg)
      if (msg.includes("429") || msg.includes("rate")) {
        const delay = (attempt + 1) * 2000
        console.log("[image-prompt] Rate limited, retry after", delay, "ms")
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      console.log("[image-prompt] Model failed, trying next")
    }
  }

  if (!imagePrompt) {
    return NextResponse.json({ error: "图片提示词生成失败：所有模型均不可用，请检查 API Key 和网络" }, { status: 502 })
  }

  await prisma.content.update({ where: { id: contentId }, data: { imagePrompt } })
  console.log("[image-prompt] Saved to DB, length:", imagePrompt.length)

  return NextResponse.json({ imagePrompt })
}