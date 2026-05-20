# Harness Engineering 实践框架 - 使用指南

## 快速开始

### 1. 项目初始化

将本框架放入你的项目根目录：

```
项目根目录/
├── AGENTS.md                    ← 项目级 AI 操作手册
├── EVOLUTION.md                 ← 进化规则记录
├── .trae/
│   └── skills/                  ← Skill 目录
│       ├── product-spec-builder/
│       ├── design-brief-builder/
│       ├── dev-planner/
│       ├── dev-builder/
│       └── code-reviewer/
└── docs/
    ├── specs/                   ← 产品需求文档
    ├── design/                  ← 设计文档
    ├── plans/                   ← 开发计划
    └── feedback/                ← 反馈记录
```

### 2. 确认 Trae Solo 已识别 Skill

在 Trae Solo 中打开项目，Agent 会自动扫描 `.trae/skills/` 目录下的所有 Skill。

你可以在对话中通过 `@技能名` 显式调用，或让 Agent 自动匹配触发。

---

## 完整工作流演示

### 场景：从零开发一个产品

#### 第一步：描述产品想法

你只需说：
```
我想做一个写作工具，能管理章节和角色设定
```

**触发 Skill**：product-spec-builder

AI 会自动：
1. 通过多轮追问细化需求（一次一问）
2. 提供 2-3 种方案让你选择
3. 等你确认后生成 Product Spec 文档
4. 保存到 `docs/specs/YYYY-MM-DD-<topic>-spec.md`

#### 第二步：定义视觉风格

你只需说：
```
深色主题，极简风格
```

**触发 Skill**：design-brief-builder

AI 会自动：
1. 追问细化配色方案、字体、组件风格等
2. 等你确认后生成 Design Brief 文档
3. 保存到 `docs/design/YYYY-MM-DD-<topic>-design-brief.md`

#### 第三步：制定开发计划

你只需说：
```
Spec 和设计都确认了，制定开发计划
```

**触发 Skill**：dev-planner

AI 会自动：
1. 读取 Product Spec 和 Design Brief
2. 技术调研（查找可用组件/库）
3. 拆分 Phase 和 Task
4. 生成 Dev Plan
5. 保存到 `docs/plans/YYYY-MM-DD-<topic>-dev-plan.md`

#### 第四步：开始开发

你只需说：
```
开始开发
```

**触发 Skill**：dev-builder

AI 会自动：
1. 按 Dev Plan 逐 Task 实现
2. 每个 Task 遵循 TDD 流程（先写测试 → 实现 → 重构）
3. 每个 Task 完成后编译验证
4. 标记完成，进入下一个 Task

#### 第五步：代码审查

每个 Task 完成后，AI 会自动触发代码审查（或你说"审查一下代码"）

**触发 Skill**：code-reviewer

AI 会自动：
1. Stage 1：对照 Spec 检查功能完整性
2. Stage 2：五轴评审（正确性、可读性、测试、安全、性能）
3. 输出审查报告

---

## Skill 速查表

| Skill | 触发关键词 | 产出物 |
|-------|-----------|--------|
| product-spec-builder | "做一个XX"、"功能需求"、"产品想法" | Product Spec 文档 |
| design-brief-builder | "视觉风格"、"配色"、"UI主题" | Design Brief 文档 |
| dev-planner | "开发计划"、"拆解任务"、"Phase" | Dev Plan 文档 |
| dev-builder | "开始开发"、"实现"、"编码" | 代码文件 |
| code-reviewer | "审查代码"、"code review"、"检查一下" | 审查报告 |

---

## Context 管理最佳实践

### 核心原则

**每个 Phase 开始时，必须让 AI 重新读文档。**

### 具体做法

1. **新开 Session 时**：
   ```
   继续开发。请先重新读取 Product Spec 和 Dev Plan，然后从 T005 开始。
   ```

2. **Session 很长时**：
   ```
   上下文可能有点长了，请总结当前进度，然后继续 T008。
   ```

3. **发现 AI 忘记需求时**：
   ```
   你可能忘了之前的约定，请重新读取 Product Spec 中关于 XX 的部分。
   ```

### 为什么需要重新读？

AI 的上下文窗口有限，随着对话变长，早期的信息会被"挤出"窗口。重新读取确保 AI 始终基于最新、完整的上下文工作。

---

## 反馈与进化系统

### 自动反馈记录

当你表达不满或修正意见时，系统会自动记录：

你："你又忘了，深色主题的配色不是这样的"

→ 系统自动在 `docs/feedback/FEEDBACK-INDEX.md` 中记录：
```
反馈 #1
- 时间: 2026-05-19 14:30
- 场景: dev-builder (T003 UI 实现)
- 反馈内容: 忘记了深色主题的配色规范
- 出现次数: 1
```

### 进化规则

同一条反馈出现 **3 次以上**，系统会提议：

> "这条反馈已经出现 3 次了，是否将它升级为正式规则，写入 EVOLUTION.md？"

你确认后，这条规则就会成为永久约束。

---

## 常见问题

### Q: 能不能跳过 Spec 直接开发？
A: 不可以。这是框架的核心约束。没有 Spec 的开发 = 反复返工。

### Q: 一个产品能一个 Session 跑完吗？
A: 不太可能。完整产品需要多个 Session，Dev Plan 就是跨 Session 接续开发的锚点。

### Q: 小项目也要走完整流程吗？
A: 是的。"简单项目"往往因未审视的假设导致最大浪费。可以简化文档，但流程不能跳。

### Q: AI 不遵守流程怎么办？
A: AGENTS.md 中定义了"反模式防御"，明确禁止了跳过流程的行为。如果 AI 仍然不遵守，提醒它重新读取 AGENTS.md。

### Q: 如何自定义或扩展 Skill？
A: 在 `.trae/skills/` 目录下新建文件夹，放入 SKILL.md 文件即可。参考现有 Skill 的格式。

### Q: 反馈系统需要手动开启吗？
A: 不需要。系统会自动检测你的消息中是否有修正或不满的关键词，检测到就自动记录。

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-05-19 | 初始版本，5 个核心 Skill + 反馈进化系统 |
