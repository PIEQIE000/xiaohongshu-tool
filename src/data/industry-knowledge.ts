// 铝单板行业知识库
// 只包含事实数据和行业信息，不包含内容创作规则
// 新增行业知识时直接添加模块，无需修改模板

export interface KnowledgeModule {
  id: string
  name: string
  description: string
  content: string
  tags: string[] // 用于模板按需引用：knowledge / visual / faq / auto-factory / auto-shipping
}

export const industryKnowledge: KnowledgeModule[] = [
  // ===== 加工流程 =====
  {
    id: "process-flow",
    name: "铝单板加工流程",
    description: "从铝锭到成品的完整生产链条",
    tags: ["auto-factory", "knowledge"],
    content: `## 铝单板标准加工流程
开料 → 折弯 → 焊接 → 打磨 → 铬化处理（钝化） → 喷涂 → 烘烤固化 → 质检 → 包装

### 关键工序细节
- **开料**：根据图纸把铝板裁成所需尺寸，数控冲床或激光切割
- **折弯**：数控折弯机成型，精度要求±0.5mm以内
- **焊接**：TIG弧焊或MIG熔化极焊，焊缝需平整无砂眼
- **打磨**：焊缝打磨平整，去除氧化膜和毛刺
- **铬化处理**：也称钝化处理，在铝板表面形成致密的铬酸盐保护膜，是喷涂前不可跳过的工序，直接影响涂层附着力
- **喷涂**：底涂→面涂→罩光（氟碳喷涂标准流程叫"三涂两烘"）
- **烘烤**：固化温度180-230°C，时间10-20分钟
- **质检**：逐件检查尺寸、表面、色差、附着力

### 设备信息
- 数控冲床、激光切割机、数控折弯机、氩弧焊机、自动喷涂线、固化炉
- 一台进口数控折弯机价格在100-200万区间
- 一条自动喷涂线投入通常几百万到上千万`,
  },

  // ===== 表面处理工艺 =====
  {
    id: "surface-treatment",
    name: "表面处理工艺",
    description: "氟碳喷涂、粉末喷涂、木纹转印、阳极氧化等工艺的详细说明",
    tags: ["knowledge", "auto-factory", "visual"],
    content: `## 氟碳喷涂（PVDF）
- 工艺：三涂两烘（底涂+面涂+罩光，两次烘烤）
- 材料：PVDF（聚偏氟乙烯）含量≥70%
- 耐候性：15-20年不褪色
- 适用：外墙幕墙、高层建筑
- 价格：约180-280元/㎡（含材料+加工）
- 颜色：金属色、纯色，金属色更贵
- 色差标准：ΔE≤1.5（国标），好厂能做到ΔE≤0.8

## 粉末喷涂
- 工艺：静电喷涂，聚酯粉末，一次喷涂一次烘烤
- 耐候性：5-8年（户外），室内更久
- 适用：室内吊顶、隔断、部分外墙
- 价格：约120-180元/㎡
- 颜色：选择极多，纯色效果最好
- 缺点：户外耐候不如氟碳，阳光暴晒久了会褪色

## 木纹转印
- 工艺：静电喷涂聚酯粉末后，贴热转印纸，高温烘烤使纹理转印到铝板上
- 效果：仿实木纹理，远看几乎一样
- 价格：约150-220元/㎡
- 适用：室内装饰、门套、包柱
- 优点：比真木便宜太多，且防潮防火

## 阳极氧化
- 工艺：电解处理，在铝板表面形成氧化膜
- 效果：金属质感强，颜色通透
- 适用：高端装饰、电子产品外壳
- 价格：较高，约200-350元/㎡
- 缺点：颜色选择有限，主要是银白、古铜等金属色

## 拉丝处理
- 不是表面处理，是机械处理
- 用砂带在铝板表面打磨出细密纹理
- 配合阳极氧化或氟碳喷涂效果更好`,
  },

  // ===== 厚度标准 =====
  {
    id: "thickness-standards",
    name: "厚度标准",
    description: "国标厚度规范和行业实际厚度情况",
    tags: ["knowledge", "faq"],
    content: `## 国家标准
- 标准号：GB/T 23443-2009《建筑装饰用铝单板》
- 外墙用：最小厚度2.0mm，常用2.0/2.5/3.0mm
- 内墙用：1.5/2.0mm
- 超高层（100m+）：建议3.0mm以上
- 双曲板/异形板：通常2.5-3.0mm

## 行业实际
- 国标允许厚度负偏差（下差）
- 标2.5mm的板，实际可能2.3-2.4mm（行业常态）
- 以次充好的情况：标2.5mm实际只有1.8mm
- 鉴别方法：游标卡尺实测，正规厂不会差太多
- 千分尺测出来和标称差0.2mm以内算正常

## 不同建筑高度对应厚度
- 3层以下（别墅/自建房）：2.0mm够用
- 3-10层（普通办公楼）：2.0-2.5mm
- 10-30层（写字楼/酒店）：2.5-3.0mm
- 30层以上（超高层/地标）：3.0mm+`,
  },

  // ===== 价格构成 =====
  {
    id: "pricing",
    name: "价格构成",
    description: "铝单板价格的组成部分和计算逻辑",
    tags: ["knowledge", "faq", "auto-shipping"],
    content: `## 价格构成公式
铝单板价格 = 铝锭价 + 加工费 + 表面处理费 + 包装运输

### 铝锭价
- 参考上海期货交易所（SHFE）当日铝价
- 铝价波动直接影响成品价格
- 比如铝锭涨1000元/吨，成品每㎡大概涨5-10元

### 加工费
- 常规平板：20-40元/㎡
- 折弯成型：30-60元/㎡
- 异形/双曲板：80-200元/㎡（工艺难度大）

### 表面处理费
- 粉末喷涂：30-50元/㎡
- 氟碳喷涂：60-100元/㎡
- 木纹转印：40-70元/㎡
- 阳极氧化：80-150元/㎡

### 包装运输
- 木架打包：15-30元/㎡
- 专线物流：按距离算，珠三角内约10-20元/㎡
- 长途（跨省）：30-80元/㎡

### 参考总价（出厂价，含表面处理）
- 平板粉末喷涂：150-220元/㎡
- 平板氟碳喷涂：220-320元/㎡
- 异形氟碳喷涂：300-500元/㎡`,
  },

  // ===== 佛山产业 =====
  {
    id: "foshan-industry",
    name: "佛山铝单板产业",
    description: "佛山铝单板产业集群信息",
    tags: ["knowledge", "faq", "auto-factory"],
    content: `## 佛山铝单板产业集群
- 主要集中在南海区、顺德区
- 产业链完整：铝锭→铝型材→钣金加工→表面处理→幕墙工程一条龙
- 佛山有全国最大的铝材交易市场，原材料获取成本低
- 相比江浙地区，佛山铝单板价格通常低10-15%
- 物流优势：珠三角城市群24小时可达，覆盖广东全省

## 佛山铝单板特点
- 供应链成熟，从铝锭到成品可以在一个园区内完成
- 喷涂配套厂多，不用等排期
- 珠三角项目客户多，工地需求稳定
- 竞争激烈，倒逼厂家提升质量和服务

## 运输时效
- 佛山到广州/深圳：当天或次日达
- 佛山到粤东/粤西：1-2天
- 跨省物流：3-5天（专线直达）`,
  },

  // ===== 安装施工 =====
  {
    id: "installation",
    name: "安装施工规范",
    description: "铝单板安装的工艺流程和验收标准",
    tags: ["knowledge", "faq"],
    content: `## 安装流程
放线定位 → 安装龙骨骨架 → 安装铝单板 → 打密封胶 → 清理验收

## 关键要点
- **龙骨间距**：通常600-800mm，间距过大容易变形
- **挂件选择**：铝合金挂件或不锈钢挂件，不能用铁件（会生锈）
- **密封胶**：中性硅酮耐候密封胶，不能用酸性胶（腐蚀铝板）
- **防水设计**：板缝宽度6-10mm，内填泡沫棒再打胶
- **排水孔**：底部留排水孔，防止雨水积聚

## 常见问题
- 板缝不均匀：安装前弹线定位，用定位垫片控制间距
- 胶缝开裂：基层没清理干净或胶没打满
- 板面变形：龙骨间距太大或板材太薄
- 色差明显：不同批次混用，安装前必须按批次分类

## 验收标准
- 表面平整度：≤2mm/2m靠尺
- 接缝直线度：≤3mm/5m
- 板面垂直度：≤3mm
- 密封胶饱满、均匀、无气泡`,
  },

  // ===== 图纸节点 =====
  {
    id: "drawings-nodes",
    name: "图纸与节点",
    description: "铝单板图纸解读和常见节点类型",
    tags: ["knowledge", "faq"],
    content: `## 常见节点类型
- **收边收口**：顶角线、底角线、阴阳角收口，决定最终效果
- **穿孔板**：圆孔/方孔/异形孔，用于透光通风和装饰效果
- **双曲板**：三维曲面造型，加工难度最高，价格最贵
- **包柱**：圆柱/方柱包覆，注意展开尺寸计算
- **格栅板**：通风遮阳用，常见于建筑外立面

## 图纸要点
- 展开图：把三维板展开成平面尺寸，加工用
- 排版图：整面墙的板块排布和编号
- 节点详图：收口、转角、收边的放大图
- 客户最常问：能不能做这个造型？需要看节点图才能算加工难度

## 报价相关
- 异形板需要出展开图才能准确报价
- 双曲板需要三维建模，加工费通常是平板的3-5倍
- 穿孔板要注明孔径、孔距、穿孔率`,
  },

  // ===== 术语词典 =====
  {
    id: "terminology",
    name: "行业术语白话翻译",
    description: "专业术语和对应的通俗说法",
    tags: ["knowledge", "faq", "visual"],
    content: `## 专业术语 → 白话翻译
- 氟碳喷涂（PVDF） → 就是铝板表面那层"漆"，好的能管20年不褪色
- 粉末喷涂 → 静电喷的"粉"，颜色多但没氟碳耐用
- 铬化处理/钝化 → 喷涂前给铝板"打底"的工序，不做好漆会掉
- 三涂两烘 → 刷三层漆、烤两次，氟碳喷涂的标准做法
- ΔE色差值 → 两块板颜色差多少，数字越小色差越小
- 游标卡尺 → 用来量铝板实际厚度的工具，精度0.02mm
- 双曲板 → 同时向两个方向弯曲的板，像马鞍那种形状
- 木纹转印 → 把木纹"印"到铝板上，不是真木头
- 龙骨 → 铝板背后的"骨架"，固定在墙上再挂铝板
- 展开图 → 把弯曲的铝板"铺平"画出来的尺寸图
- 中性硅酮胶 → 铝板缝里打的密封胶，不能用酸性的会腐蚀

## 行业"黑话"
- 下差/负偏差 → 实际厚度比标称薄一点，行业默许的
- 上件/下件 → 喷涂线上的挂板和取板工序
- 色号/色板 → 客户选颜色的样本
- 一涂/二涂/罩光 → 氟碳喷涂的三层漆：底漆+面漆+保护层`,
  },
]

// 按标签快速查找模块
export function getKnowledgeModules(tags: string[], customModules: KnowledgeModule[] = []): KnowledgeModule[] {
  if (tags.length === 0) return []
  const allModules = mergeKnowledge(customModules)
  return allModules.filter(m => tags.some(t => m.tags.includes(t)))
}

// 根据内容类型获取相关知识模块
export function getKnowledgeByContentType(contentType: string, customModules: KnowledgeModule[] = []): KnowledgeModule[] {
  const tagMap: Record<string, string[]> = {
    factory_real: ["auto-factory", "knowledge"],
    ai_render: ["visual", "knowledge"],
    knowledge: ["knowledge", "faq"],
    shipping: ["auto-shipping", "knowledge"],
  }
  const tags = tagMap[contentType] || ["knowledge"]
  return getKnowledgeModules(tags, customModules)
}

// 渲染知识库内容到 prompt
export function renderKnowledgeContent(moduleIds: string[], customModules: KnowledgeModule[] = []): string {
  const modules = mergeKnowledge(customModules).filter(m => moduleIds.includes(m.id))
  if (modules.length === 0) return ""
  return "\n\n## 行业知识参考（以下内容供你准确使用，不要原样复制）\n" +
    modules.map(m => m.content).join("\n\n---\n\n")
}

// 合并内置知识与自定义知识（页面端可传入 localStorage 数据，覆盖同名 ID 模块）
function mergeKnowledge(customModules: KnowledgeModule[]): KnowledgeModule[] {
  if (!customModules || customModules.length === 0) return industryKnowledge
  const customIds = new Set(customModules.map(m => m.id))
  const filteredBuiltIn = industryKnowledge.filter(m => !customIds.has(m.id))
  return [...filteredBuiltIn, ...customModules]
}
