// 内容创作规则：基于自媒体传播规律总结的策略指令
// 用于增强 Prompt 模板中的模糊指令，使 AI 生成的内容符合已验证的好内容特征
// 每条规则有明确的 instruction 文本，可独立开关、独立编辑

export interface ContentRule {
  id: string
  name: string
  description: string
  category: "structure" | "audience" | "material" | "hook"
  appliesTo: string[] // 适用的内容类型：factory_real | ai_render | knowledge | shipping | knowledge_manual | visual_manual | faq_manual
  instruction: string
  enabled: boolean
}

// 结构规则：控制内容骨架
// 受众规则：控制身份认同和开场
// 素材规则：控制素材选择逻辑（在 API 层使用）
// 话术规则：控制结尾引导（在 API 层追加）

const contentRules: ContentRule[] = [
  // ===== 情绪规律 =====
  {
    id: "high-arousal-emotion",
    name: "高唤醒情绪优先",
    description: "标题和开头必须触发高唤醒情绪（好奇/惊喜/共鸣），避免低唤醒表达",
    category: "structure",
    appliesTo: ["factory_real", "ai_render", "knowledge", "shipping", "knowledge_manual", "visual_manual", "faq_manual"],
    instruction: `## 情绪触发规则（必须遵守）
标题必须使用以下手法之一制造高唤醒情绪：
- 反常识/反差："为什么越便宜的铝板越没人买"
- 具体数字+结果："标2.5mm实测2.0mm，客户退了一批货"
- 身份确认+场景共鸣："装修选材料，你是不是也在这踩过坑"
- 悬念/好奇："喷涂车间42度，师傅说了句话让我愣住"
禁止：纯描述性标题（如"铝单板知识分享"）、招商话术、"实力展示"类开头。
正文开头第一句话必须延续标题的情绪，不能突然变平淡。`,
    enabled: true,
  },

  // ===== 信息密度规律 =====
  {
    id: "information-density",
    name: "高信息密度约束",
    description: "正文长度控制、分点结构、开头钩子、单位信息量最大化",
    category: "structure",
    appliesTo: ["factory_real", "ai_render", "knowledge", "shipping", "knowledge_manual", "visual_manual", "faq_manual"],
    instruction: `## 信息密度规则（必须遵守）
- 开头第一段必须有钩子：反常识陈述/强共鸣场景/直接痛点，不能铺垫背景
- 正文用"分点/分步骤"结构，每条包含一个具体信息点
- 能用一句话讲清楚的事，不用两句话
- 正文长度严格控制在 200-350 字
- 禁止使用"废话型"过渡词（如"众所周知""大家都知道"）
- 每个段落必须推进信息，不能有"情绪填充"段落`,
    enabled: true,
  },

  // ===== 身份认同规律 =====
  {
    id: "identity-resonance",
    name: "身份认同开场",
    description: "正文开头确认用户身份，让用户觉得'这说的是我'",
    category: "audience",
    appliesTo: ["knowledge", "knowledge_manual", "visual_manual", "faq_manual"],
    instruction: `## 身份认同规则（必须遵守）
正文开头必须包含身份确认元素，让用户产生"这说的就是我"的感受：
- 直接称呼目标身份："正在装修的业主""选幕墙材料的设计师""跑工地的项目经理"
- 还原用户常见场景："你是不是也遇到过…"
- 暴露用户真实焦虑："怕被坑""怕选错""怕超预算"
- 用"我们/你"代替"客户/消费者"，拉近距离
身份确认必须在开头30字内完成，不要等。`,
    enabled: true,
  },

  // ===== 信任信号规律 =====
  {
    id: "trust-signal",
    name: "信任信号优先",
    description: "内容中必须包含可信的第三方证据，而非自我宣称",
    category: "material",
    appliesTo: ["factory_real", "knowledge", "shipping", "knowledge_manual", "faq_manual"],
    instruction: `## 信任信号规则（必须遵守）
内容中必须包含以下信任信号至少2种：
- 具体数字/数据（厚度、价格、温度、时间等可验证信息）
- 真实场景描述（车间环境、人物状态、具体工序）
- 客户反馈/案例（不是编的，是你遇到的真实情况）
- 自我暴露（翻车经历、做不到的事、承认的缺点）
- 对比验证（好vs差、实测vs标称）
禁止纯自我宣称：不说"品质卓越""行业领先""值得信赖"——用具体证据代替。`,
    enabled: true,
  },

  // ===== 社交货币规律 =====
  {
    id: "social-currency",
    name: "社交货币结尾",
    description: "结尾话术让转发者显得有品味/懂行/关心朋友",
    category: "hook",
    appliesTo: ["factory_real", "ai_render", "knowledge", "shipping", "knowledge_manual", "visual_manual", "faq_manual"],
    instruction: `## 社交货币规则（必须遵守）
每条内容必须有社交货币价值——让人转发不是因为内容好，是因为转发这个行为让他看起来：
- 懂行："这条干货我早就收藏了"
- 有品味："这个搭配太高级了"
- 关心别人："转给正在装修的朋友，少走弯路"

固定话术钩子必须满足上述至少一种效果。`,
    enabled: true,
  },

  // ===== 确定性规律 =====
  {
    id: "consistency",
    name: "内容确定性",
    description: "内容系列化、栏目化，让用户确定你以后还会提供同类价值",
    category: "structure",
    appliesTo: ["factory_real", "ai_render", "knowledge", "shipping"],
    instruction: `## 确定性规则（必须遵守）
- 正文结尾可以暗示后续内容："下期带你看喷涂线""明天讲怎么鉴别厚度"
- 同一内容类型的标题风格保持一致性
- 不要用一次性标题（如"今天分享一个…"），用系列感标题（如"铝板车间观察#3"）
- 让读者觉得你是一个"持续输出专业内容"的人`,
    enabled: false,
  },
]

export default contentRules

// 按内容类型筛选启用的规则
export function getEnabledRules(contentType: string, customRules: Partial<ContentRule>[] = []): ContentRule[] {
  const merged = mergeRules(customRules)
  return merged.filter(r => r.enabled && r.appliesTo.includes(contentType))
}

// 获取所有规则
export function getAllRules(customRules: Partial<ContentRule>[] = []): ContentRule[] {
  return mergeRules(customRules)
}

// 按分类筛选
export function getRulesByCategory(category: ContentRule["category"], customRules: Partial<ContentRule>[] = []): ContentRule[] {
  return mergeRules(customRules).filter(r => r.category === category)
}

// 合并内置规则和自定义规则（页面端可传入 localStorage 数据）
function mergeRules(customRules: Partial<ContentRule>[]): ContentRule[] {
  if (!customRules || customRules.length === 0) return contentRules
  const customIds = new Set(customRules.map(r => r.id))
  const filteredBuiltIn = contentRules.filter(r => !customIds.has(r.id))
  return [...filteredBuiltIn, ...customRules.map(r => {
    const base = contentRules.find(b => b.id === r.id)
    return { ...base, ...r } as ContentRule
  })]
}

// 渲染结构/受众规则到 Prompt
export function renderRulesForPrompt(contentType: string, customRules: Partial<ContentRule>[] = []): string {
  const rules = getEnabledRules(contentType, customRules)
  const injectable = rules.filter(r => r.category === "structure" || r.category === "audience")
  if (injectable.length === 0) return ""
  return "\n\n## 内容创作规则（以下规则优先级高于模板默认规范，必须逐条遵守）\n" +
    injectable.map(r => r.instruction).join("\n\n")
}

// 渲染话术规则到 Prompt 钩子
export function renderHookRules(contentType: string, customRules: Partial<ContentRule>[] = []): string {
  const rules = getEnabledRules(contentType, customRules)
  const hookRules = rules.filter(r => r.category === "hook")
  if (hookRules.length === 0) return ""
  return "\n\n" + hookRules.map(r => r.instruction).join("\n\n")
}
