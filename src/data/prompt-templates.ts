export interface PromptTemplate {
  id: string
  name: string
  category: "knowledge" | "visual" | "faq"
  content: string
  variables: string[]
  isDefault: boolean
}

export const builtInTemplates: PromptTemplate[] = [
  {
    id: "default-knowledge",
    name: "知识科普类",
    category: "knowledge",
    content: `你是一位资深铝单板行业专家，擅长在小红书用通俗易懂的方式分享专业知识。请根据以下选题，生成一篇小红书爆款笔记。

选题：{选题}
目标客户：{目标客户}
核心卖点：{核心卖点}

要求：
1. 采用"痛点场景 → 知识点拆解 → 避坑建议"三段式结构
2. 标题要有吸引力，直击痛点
3. 正文不超过300字
4. 包含{emoji数量}个 emoji 增强感染力
5. 结尾添加{标签数量}个精准标签，格式 #标签1 #标签2
6. 语言风格：专业但不生硬，像朋友聊天一样
7. 检查所有表述是否符合广告法要求`,
    variables: ["选题", "目标客户", "核心卖点", "emoji数量", "标签数量"],
    isDefault: true,
  },
  {
    id: "default-visual",
    category: "visual",
    name: "视觉展示类",
    content: `你是一位铝单板产品设计展示专家，擅长通过视觉对比展现产品价值。请根据以下选题，生成一篇小红书爆款笔记。

选题：{选题}
展示内容：{展示内容}
适用场景：{适用场景}

要求：
1. 采用"效果对比 → 工艺解析 → 适用场景"三段式结构
2. 标题要突出视觉冲击力
3. 正文不超过300字
4. 包含{emoji数量}个 emoji
5. 结尾添加{标签数量}个精准标签
6. 重点描述工艺细节和视觉效果
7. 引导用户想象实际应用场景`,
    variables: ["选题", "展示内容", "适用场景", "emoji数量", "标签数量"],
    isDefault: true,
  },
  {
    id: "default-faq",
    name: "客户问答类",
    category: "faq",
    content: `你是一位经验丰富的铝单板销售顾问，擅长解答客户疑问并建立信任。请根据以下选题，生成一篇小红书爆款笔记。

选题：{选题}
问题描述：{问题描述}
专业解答：{专业解答}

要求：
1. 采用"常见问题 → 专业解答 → 引导咨询"三段式结构
2. 标题要直接回应客户疑问
3. 正文不超过300字
4. 包含{emoji数量}个 emoji
5. 结尾添加{标签数量}个精准标签
6. 用真实案例或数据增强说服力
7. 结尾自然引导客户咨询，不要硬广`,
    variables: ["选题", "问题描述", "专业解答", "emoji数量", "标签数量"],
    isDefault: true,
  },
]
