# Dev Plan: 小红书铝单板内容运营工具

## Phase 1: 项目初始化
**交付物**：可运行的 Next.js 空项目，带基础布局和侧边栏导航

### Task 列表

| ID | 描述 | 涉及文件 | 验收标准 | 依赖 | Wave |
|----|------|---------|---------|------|------|
| T001 | 初始化 Next.js 项目（App Router + TypeScript + Tailwind） | 项目根目录 | `npm run dev` 成功启动，访问 localhost:3000 可见默认页 | 无 | 1 |
| T002 | 安装依赖（Prisma, SQLite, shadcn/ui, lucide-react） | package.json | `npm install` 无报错 | T001 | 2 |
| T003 | 配置 Tailwind 主题色（Violet 主色 + 全套色板） | tailwind.config.ts | 主题色可在组件中使用 | T002 | 2 |
| T004 | 初始化 shadcn/ui 基础组件（Button, Input, Card） | components/ui/ | 组件可正常导入使用 | T002 | 2 |
| T005 | 创建 App 基础布局（侧栏 + 顶栏 + 主内容区） | app/layout.tsx, components/Sidebar.tsx, components/TopBar.tsx | 页面显示 240px 侧栏和顶部栏 | T003, T004 | 3 |
| T006 | 创建侧栏导航菜单（7 个模块入口） | components/Sidebar.tsx | 点击菜单项可切换路由，当前项有 Violet 高亮 | T005 | 4 |

---

## Phase 2: 数据层与选题管理
**交付物**：完整的数据库模型 + 选题管理看板（增删改查 + 状态筛选）

### Task 列表

| ID | 描述 | 涉及文件 | 验收标准 | 依赖 | Wave |
|----|------|---------|---------|------|------|
| T007 | 定义 Prisma Schema（Topic, Content, Asset, CalendarEntry, Metric, PromptTemplate, MaterialSnippet） | prisma/schema.prisma | `npx prisma generate` 成功 | T002 | 1 |
| T008 | 执行数据库迁移 | prisma/migrations/ | `npx prisma db push` 成功，SQLite 文件生成 | T007 | 2 |
| T009 | 创建 Prisma Client 单例 | lib/prisma.ts | 可在 API 中正常导入使用 | T008 | 2 |
| T010 | 选题列表 API（GET /api/topics，支持状态/标签筛选） | app/api/topics/route.ts | 返回 JSON 数组，支持 ?status=&tag= 参数 | T009 | 3 |
| T011 | 选题创建 API（POST /api/topics） | app/api/topics/route.ts | 创建成功返回新记录 | T009 | 3 |
| T012 | 选题更新 API（PUT /api/topics/[id]） | app/api/topics/[id]/route.ts | 更新成功返回更新后记录 | T009 | 3 |
| T013 | 选题删除 API（DELETE /api/topics/[id]） | app/api/topics/[id]/route.ts | 删除成功返回 204 | T009 | 3 |
| T014 | 选题列表页面（表格/卡片视图） | app/topics/page.tsx | 显示所有选题，支持搜索框过滤 | T010 | 4 |
| T015 | 选题创建对话框 | app/topics/page.tsx, components/CreateTopicDialog.tsx | 点击按钮弹窗，表单验证后创建 | T011 | 4 |
| T016 | 选题编辑/删除功能 | app/topics/page.tsx | 行内编辑或弹窗编辑，删除有确认提示 | T012, T013 | 5 |
| T017 | 选题看板视图（按状态分栏拖拽） | app/topics/kanban/page.tsx | 四栏：待写/写作中/已完成/已发布 | T010, T012 | 5 |

---

## Phase 3: AI 文案生成与编辑器
**交付物**：OpenRouter API 集成 + Prompt 模板引擎 + 文案编辑界面

### Task 列表

| ID | 描述 | 涉及文件 | 验收标准 | 依赖 | Wave |
|----|------|---------|---------|------|------|
| T018 | 创建 OpenRouter API 客户端（流式调用） | lib/openrouter.ts | 可发送请求并接收流式响应 | T003 | 1 |
| T019 | 创建 API Key 配置页面 | app/settings/page.tsx | 输入框保存 API Key 到 .env 或本地 | 无 | 1 |
| T020 | 内置 Prompt 模板引擎（变量替换） | lib/prompt-engine.ts | `{选题}` 等占位符可正确替换 | 无 | 1 |
| T021 | 内置 3 个铝单板行业 Prompt 模板 | data/prompt-templates.ts | 知识科普/视觉展示/客户问答 3 套模板 | T020 | 2 |
| T022 | AI 文案生成 API（POST /api/generate） | app/api/generate/route.ts | 接收 Prompt 返回流式文案 | T018, T020, T021 | 3 |
| T023 | 内容创作页面（模板选择 + 参数配置） | app/content/page.tsx | 用户可选择模板、输入选题、调整参数 | T021 | 3 |
| T024 | 文案生成结果展示（流式输出） | app/content/page.tsx, components/AIResponse.tsx | 文案逐字显示，支持停止生成 | T022 | 4 |
| T025 | 文案编辑器（富文本/Markdown） | components/ContentEditor.tsx | 支持编辑标题、正文、标签 | 无 | 4 |
| T026 | 多版本对比（A/B 版本切换） | components/VersionCompare.tsx | 可生成 2 个版本并切换查看 | T023, T024 | 5 |
| T027 | AI 质量增强（一键优化） | app/api/enhance/route.ts, components/EnhanceButton.tsx | 点击按钮调用增强 Prompt，替换原文案 | T022 | 5 |

---

## Phase 4: 素材库与图片处理
**交付物**：素材库管理（图片上传 + 文案片段收藏）+ 图片裁剪工具

### Task 列表

| ID | 描述 | 涉及文件 | 验收标准 | 依赖 | Wave |
|----|------|---------|---------|------|------|
| T028 | 素材库数据库 API（GET/POST/DELETE /api/assets） | app/api/assets/route.ts | 支持上传记录增删查 | T009 | 1 |
| T029 | 文件上传 API（/api/upload） | app/api/upload/route.ts | 接收图片保存到 public/uploads/ | T009 | 1 |
| T030 | 图片素材列表页（网格视图） | app/materials/page.tsx | 显示所有上传的图片，支持分类筛选 | T028 | 2 |
| T031 | 图片上传组件 | components/ImageUploader.tsx | 拖拽/选择上传，显示预览 | T029 | 2 |
| T032 | 图片预览对话框 | components/ImagePreview.tsx | 点击查看大图 | T030 | 3 |
| T033 | 图片裁剪组件（3:4 比例） | components/ImageCropper.tsx | 可裁剪并导出 3:4 比例图片 | T032 | 3 |
| T034 | 文案片段 API（/api/snippets） | app/api/snippets/route.ts | 文案片段增删改查 | T009 | 1 |
| T035 | 文案片段管理页 | app/materials/snippets/page.tsx | 列表展示，支持标签搜索 | T034 | 2 |
| T036 | 素材插入编辑器 | components/ContentEditor.tsx | 写作时可从素材库一键插入 | T025, T030, T035 | 4 |

---

## Phase 5: 排期发布
**交付物**：日历视图发布计划 + 一键复制文案/下载图片

### Task 列表

| ID | 描述 | 涉及文件 | 验收标准 | 依赖 | Wave |
|----|------|---------|---------|------|------|
| T037 | 排期数据库 API（/api/schedule） | app/api/schedule/route.ts | 支持排期增删改查 | T009 | 1 |
| T038 | 日历视图组件 | components/Calendar.tsx | 月视图显示，已排期日期有标记 | 无 | 1 |
| T039 | 排期页面（日历 + 列表双视图） | app/schedule/page.tsx | 显示所有排期内容 | T037, T038 | 2 |
| T040 | 内容绑定排期（从内容页设置发布日期） | app/content/page.tsx | 可选择日期并保存 | T025, T037 | 2 |
| T041 | 拖拽调整排期 | components/Calendar.tsx | 拖拽卡片到新日期 | T039 | 3 |
| T042 | 一键复制文案 | components/CopyButton.tsx | 点击复制完整文案到剪贴板 | 无 | 3 |
| T043 | 一键下载图片 | components/DownloadButton.tsx | 点击打包下载关联图片 | T030 | 3 |
| T044 | 发布跳转小红书 | components/PublishButton.tsx | 新窗口打开小红书创作者中心 | 无 | 4 |

---

## Phase 6: 数据复盘
**交付物**：手动/自动数据录入 + 可视化图表 + 内容诊断

### Task 列表

| ID | 描述 | 涉及文件 | 验收标准 | 依赖 | Wave |
|----|------|---------|---------|------|------|
| T045 | 数据录入 API（/api/metrics） | app/api/metrics/route.ts | 支持指标增删改查 | T009 | 1 |
| T046 | 数据录入表单 | app/analytics/page.tsx, components/MetricForm.tsx | 手动输入点赞/收藏/评论/阅读量 | T045 | 1 |
| T047 | 数据趋势图（折线图） | components/Charts/TrendChart.tsx | 使用 recharts 展示 7/30 天趋势 | T046 | 2 |
| T048 | 内容表现排行（柱状图） | components/Charts/BarChart.tsx | 按互动量排序显示笔记排行 | T046 | 2 |
| T049 | 数据概览仪表盘 | app/analytics/page.tsx | 汇总卡片：总互动/平均互动/最佳内容 | T047, T048 | 3 |
| T050 | 内容诊断建议 | lib/diagnosis.ts, components/DiagnosisPanel.tsx | 基于数据给出优化建议 | T049 | 3 |
| T051 | 小红书 API 自动同步（预留接口） | lib/xiaohongshu-api.ts | API Key 配置后可自动拉取数据 | T045 | 4 |

---

## Phase 7: Prompt 模板管理
**交付物**：Prompt 模板 CRUD + 变量系统 + 测试预览

### Task 列表

| ID | 描述 | 涉及文件 | 验收标准 | 依赖 | Wave |
|----|------|---------|---------|------|------|
| T052 | Prompt 模板 API（/api/prompt-templates） | app/api/prompt-templates/route.ts | 支持模板增删改查 | T009 | 1 |
| T053 | 模板列表页 | app/prompt-templates/page.tsx | 显示所有模板，支持搜索 | T052 | 2 |
| T054 | 模板创建/编辑表单 | components/PromptForm.tsx | 支持编辑名称、内容、变量定义 | T052 | 2 |
| T055 | 模板变量定义系统 | components/VariableManager.tsx | 可添加 `{变量名}` 并管理 | T054 | 3 |
| T056 | 模板测试预览 | components/PromptPreview.tsx | 输入变量值，预览 Prompt 效果 + 可发 AI 测试 | T054, T055 | 3 |

---

## Phase 8: 集成与优化
**交付物**：完整内容生产闭环 + 数据备份 + 体验优化

### Task 列表

| ID | 描述 | 涉及文件 | 验收标准 | 依赖 | Wave |
|----|------|---------|---------|------|------|
| T057 | 完整工作流串联（选题 → 创作 → 排期 → 发布 → 数据） | 全局路由优化 | 可从选题页一键跳转内容创作页 | T017, T023, T039 | 1 |
| T058 | 全局搜索功能 | components/GlobalSearch.tsx | 跨模块搜索选题/素材/内容 | T014, T030, T025 | 1 |
| T059 | 数据库备份/恢复 | app/settings/page.tsx, lib/backup.ts | 支持导出 SQLite 文件和导入 | T009 | 2 |
| T060 | 错误处理与加载状态 | 全局组件 | API 失败有友好提示，加载有 spinner | 无 | 2 |
| T061 | 响应式布局适配 | 全局 CSS | 窗口缩小时布局不崩坏 | 无 | 2 |

---

## Wave 执行顺序

```
Phase 1: 项目初始化
  Wave 1: T001
  Wave 2: T002
  Wave 3: T003, T004
  Wave 4: T005
  Wave 5: T006

Phase 2: 数据层与选题管理
  Wave 1: T007
  Wave 2: T008, T009
  Wave 3: T010, T011, T012, T013
  Wave 4: T014, T015
  Wave 5: T016, T017

Phase 3: AI 文案生成与编辑器
  Wave 1: T018, T019, T020
  Wave 2: T021
  Wave 3: T022, T023
  Wave 4: T024, T025
  Wave 5: T026, T027

Phase 4: 素材库与图片处理
  Wave 1: T028, T029, T034
  Wave 2: T030, T031, T035
  Wave 3: T032, T033
  Wave 4: T036

Phase 5: 排期发布
  Wave 1: T037, T038
  Wave 2: T039, T040
  Wave 3: T041, T042, T043
  Wave 4: T044

Phase 6: 数据复盘
  Wave 1: T045, T046
  Wave 2: T047, T048
  Wave 3: T049, T050
  Wave 4: T051

Phase 7: Prompt 模板管理
  Wave 1: T052
  Wave 2: T053, T054
  Wave 3: T055, T056

Phase 8: 集成与优化
  Wave 1: T057, T058
  Wave 2: T059, T060, T061
```

## 技术选型
- **Next.js 15 (App Router)**: 前后端一体，一个命令启动全栈
- **TypeScript**: 类型安全，减少运行时错误
- **Prisma + SQLite**: Prisma 提供类型安全的 ORM，SQLite 零配置本地数据库
- **shadcn/ui**: 无头组件库，高度可定制，符合 Design Brief 要求
- **Tailwind CSS**: 原子化 CSS，快速实现设计规范
- **recharts**: React 图表库，轻量且灵活
- **OpenRouter API**: 聚合多模型，支持免费模型调用
- **lucide-react**: 图标库，风格现代

## 风险点
- **OpenRouter 免费模型不稳定**：需准备备用模型切换逻辑（T018 处理）
- **图片上传大文件**：限制文件大小（10MB），后续可加压缩
- **日历拖拽交互复杂度**：初期用简单拖拽，复杂交互后续迭代
- **小红书 API 申请难度**：数据复盘先做手动模式，自动同步预留接口
