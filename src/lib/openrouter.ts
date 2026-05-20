import OpenAI from "openai"

async function callOpenRouter(
  openai: OpenAI,
  targetModel: string,
  prompt: string,
  maxRetries = 3
): Promise<string> {
  let lastError: any
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: targetModel,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      })
      return response.choices[0]?.message?.content || ""
    } catch (err: any) {
      lastError = err
      if (err?.status === 429) {
        const wait = (i + 1) * 3000
        console.log(`[openrouter] 429 rate limited, retry ${i + 1}/${maxRetries} after ${wait}ms`)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      throw err
    }
  }
  throw lastError
}

export async function callOpenRouterWithFallback(
  openai: OpenAI,
  models: string[],
  prompt: string
): Promise<{ content: string; model: string }> {
  for (const m of models) {
    try {
      console.log(`[openrouter] trying model: ${m}`)
      const content = await callOpenRouter(openai, m, prompt)
      console.log(`[openrouter] success with model: ${m}`)
      return { content, model: m }
    } catch (err: any) {
      console.error(`[openrouter] model ${m} failed:`, err?.message || String(err))
    }
  }
  throw new Error("所有模型均调用失败")
}