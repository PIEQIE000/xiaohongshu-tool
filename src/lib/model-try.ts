const DEFAULT_MODELS = [
  "anthropic/claude-3.5-sonnet",
  "deepseek/deepseek-chat",
  "qwen/qwen-plus",
]

export function parseModels(raw: string | null): string[] {
  if (!raw) return DEFAULT_MODELS
  return raw.split(/[\n,，]+/).map(s => s.trim()).filter(Boolean)
}

export function parseModelsWithFallback(raw: string | null): string[] {
  const models = parseModels(raw)
  return models.length > 0 ? models : DEFAULT_MODELS
}