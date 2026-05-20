# Trae Solo 简化版 Harness Engineering 实践框架

## 项目目标

在 Trae Solo 上搭建一套面向产品开发全流程的简化版 Harness Engineering 框架，将 Vibe Coding 从"和 AI 聊天写代码"升级为可靠的产品开发系统。

## 核心设计理念

```
┌─────────────────────────────────────────────────────────────┐
│  Trae SOLO Agent（调度层）                                    │
│  需求理解 → Skill 匹配 → 流程路由 → Sub-Agent 派发            │
├─────────────────────────────────────────────────────────────┤
│  Skills × 5（Guides / 前馈控制）                             │
│  ├─ product-spec-builder    需求收集 + 结构化 PRD             │
│  ├─ design-brief-builder    视觉规范量化                      │
│  ├─ dev-planner             Phase 拆分 + 开发计划             │
│  ├─ dev-builder             Task 级编码 + 编译验证            │
│  └─ code-reviewer           两阶段审查（Spec + 质量）         │
├─────────────────────────────────────────────────────────────┤
│  Feedback + Evolution（Sensors + Steering Loop）              │
│  ├─ feedback 记录           用户反馈结构化存储                │
│  └─ 进化规则                重复3次+ → 写入 Skill 规则        │
└─────────────────────────────────────────────────────────────┘
```

## GitHub 成熟方案参考

在编写 Skill 之前，我们深入研究了 GitHub 上最成熟的 Harness Engineering 项目：

### 1. addyosmani/agent-skills（37.9k ⭐）

**来源**：Google Chrome 工程负责人 Addy Osmani 开源

**核心架构**：DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP 六阶段工作流

**可借鉴要点**：
- **反"代理漂移"机制**：内置常见 AI 借口和反驳论据，防止跳过步骤
- **证据驱动完成**：不是 AI 说完成了就算，需要测试通过、构建输出干净等可验证证据
- **范围纪律**：不要重构相邻系统，不要删除没完全理解的代码
- **测试金字塔比例**：80/15/5（单元测试:集成测试:端到端测试）

**可复用的 Skill**：
- `spec-driven-development` → 我们的 product-spec-builder
- `planning-and-task-breakdown` → 我们的 dev-planner
- `incremental-implementation` → 我们的 dev-builder
- `code-review` → 我们的 code-reviewer
- `debugging-and-error-recovery` → 五步分类法（复现→定位→简化→修复→防护）

### 2. obra/superpowers（150k+ ⭐）

**来源**：Anthropic 黑客松冠军 Jesse Vincent 开发

**核心架构**：brainstorming → writing-plans → TDD → subagent-driven-development

**可借鉴要点**：
- **"禁写令"设计**：`Do NOT... until...` 强制 AI 在得到批准前不写代码
- **反模式防御**：`"This Is Too Simple To Need A Design"` — 预判 AI 偷懒借口
- **一次一问原则**：`Ask clarifying questions — one at a time`
- **流水线 SOP 状态机**：给方案必须带 trade-offs 和推荐 → 分模块展示 → 沉淀为文档

**可复用的 Skill**：
- `brainstorming` → 我们的 product-spec-builder 的核心交互模式
- `writing-plans` → 我们的 dev-planner 的任务拆解逻辑
- `test-driven-development` → 我们的 dev-builder 的验证机制

### 3. gsd-build/get-shit-done（50k+ ⭐）

**核心架构**：Discuss → Design → Plan → Execute 四阶段循环

**可借鉴要点**：
- **Context Rot 解决**：每个 Agent 拿到干净的上下文窗口
- **Goal-Backward Verification**：从用户目标出发验证，不是任务清单打勾
- **Wave 并行执行**：无依赖任务编排到同一 Wave 并行

### 4. Fission-AI/OpenSpec（16.9k ⭐）

**核心架构**：Spec-Driven Development 开源框架

**可借鉴要点**：
- Spec 模板格式（specification.md, plan.md, tasks.md）
- 增量需求：发现 BUG → 写增量 Spec → AI 自动生成 PR

---

## 基于成熟方案优化的 Skill 设计

### Skill 1: product-spec-builder

**参考方案**：superpowers/brainstorming + addyosmani/spec-driven-development

**核心设计**：
```yaml
---
name: product-spec-builder
description: >
  通过多轮追问将模糊产品想法转化为结构化需求文档(PRD)。
  强制设计前置，禁止在需求明确前进入开发阶段。
  适用于用户描述产品想法、功能需求、项目启动等场景。
version: 1.0.0
---
```

**从成熟方案借鉴的关键规则**：

| 规则来源 | 规则内容 | 用途 |
|---------|---------|------|
| superpowers/brainstorming | `Do NOT write any code until the user has approved the spec` | 禁写令 |
| superpowers/brainstorming | `Anti-Pattern: "This is too simple" — Every project goes through this process` | 反模式防御 |
| superpowers/brainstorming | `Ask clarifying questions — one at a time` | 一次一问 |
| addyosmani/spec-driven | 先写失败测试，没有"后来再补" | 证据驱动 |

**执行流程**：
1. **需求收集**：一次一问追问（用户画像 → 核心功能 → 交互方式 → 边界情况）
2. **方案提案**：提供 2-3 种方案，附 trade-offs 和推荐
3. **用户确认**：等待用户签字批准
4. **生成 Spec**：输出到 `docs/specs/YYYY-MM-DD-<topic>-spec.md`
5. **Spec 结构**：遵循 OpenSpec 模板格式

### Skill 2: design-brief-builder

**参考方案**：毒舌产品经理4.0 原始设计 + superpowers/brainstorming 交互模式

**核心设计**：
```yaml
---
name: design-brief-builder
description: >
  将视觉方向量化为可执行的设计规范文档。
  通过追问把配色方案、交互元素风格、动效级别等视觉方向标准化。
  适用于用户需要定义产品视觉规范、设计风格等场景。
version: 1.0.0
---
```

**执行流程**：
1. **视觉偏好收集**：一次一问（配色方案 → 点缀色 → 文档结构 → 交互风格 → 动效级别）
2. **量化输出**：生成 Design Brief 文档
3. **用户确认**：等待用户签字批准
4. **输出**：`docs/design/YYYY-MM-DD-<topic>-design-brief.md`

### Skill 3: dev-planner

**参考方案**：addyosmani/planning-and-task-breakdown + gsd-build/get-shit-done

**核心设计**：
```yaml
---
name: dev-planner
description: >
  读取产品 Spec 和设计规范，将需求拆解为可执行的 Phase 和 Task。
  每个 Phase 有明确交付物，每个 Task 2-5 分钟可完成且可独立验证。
  适用于拿到 PRD 后需要制定开发计划、任务拆解等场景。
version: 1.0.0
---
```

**从成熟方案借鉴的关键规则**：

| 规则来源 | 规则内容 | 用途 |
|---------|---------|------|
| addyosmani/planning | `Break down into small, verifiable tasks with acceptance criteria` | 小任务可验证 |
| addyosmani/planning | `Include dependency order between tasks` | 依赖关系 |
| gsd-build | `Goal-Backward Verification: verify from user goal, not task checklist` | 目标验证 |
| gsd-build | `Wave parallel execution: no-dependency tasks run together` | 并行执行 |

**执行流程**：
1. 读取 Product Spec 和 Design Brief
2. 技术调研（查找可用组件/库）
3. 拆分 Phase（每个 Phase 有明确交付物）
4. 拆分 Task（每个 Task 2-5 分钟可完成，带验收标准）
5. 标注依赖关系和 Wave 分组
6. 输出到 `docs/plans/YYYY-MM-DD-<topic>-dev-plan.md`

### Skill 4: dev-builder

**参考方案**：addyosmani/incremental-implementation + superpowers/test-driven-development

**核心设计**：
```yaml
---
name: dev-builder
description: >
  按开发计划逐 Task 实现代码，每个 Task 完成后进行编译验证和测试。
  遵循 TDD 流程（红-绿-重构），确保每次变更都可验证。
  适用于按 Task 清单进行代码实现、功能开发等场景。
version: 1.0.0
---
```

**从成熟方案借鉴的关键规则**：

| 规则来源 | 规则内容 | 用途 |
|---------|---------|------|
| addyosmani/build | `Implement in thin vertical slices: code → test → verify → commit` | 薄垂直切片 |
| addyosmani/build | `Evidence-driven completion: tests pass, build clean, runtime trace shows expected behavior` | 证据驱动 |
| superpowers/TDD | `RED-GREEN-REFACTOR cycle: write failing test first` | TDD 强制 |
| addyosmani | `Scope discipline: do not refactor adjacent systems` | 范围纪律 |

**执行流程**：
1. 读取当前 Task 定义（含验收标准）
2. **TDD 流程**：先写失败测试（RED）→ 实现代码（GREEN）→ 重构
3. 编译/语法验证
4. 运行测试验证
5. 标记完成，进入下一 Task
6. Context 隔离：每个 Task 独立上下文

### Skill 5: code-reviewer

**参考方案**：addyosmani/code-review + 毒舌产品经理4.0 两阶段审查

**核心设计**：
```yaml
---
name: code-reviewer
description: >
  对完成的代码进行两阶段审查：Stage 1 检查 Spec 完整性，Stage 2 检查代码质量。
  Stage 1 有 HIGH 问题则停在 Stage 1，不进入 Stage 2。
  适用于代码完成后的质量检查、Spec 合规性验证等场景。
version: 1.0.0
---
```

**从成熟方案借鉴的关键规则**：

| 规则来源 | 规则内容 | 用途 |
|---------|---------|------|
| addyosmani/code-review | `Five-axis review: correctness, readability, test coverage, security, performance` | 五轴评审 |
| addyosmani/code-review | `100-line change limit: review in small batches` | 小批量审查 |
| addyosmani | `Anti-rationalization table: counter common AI excuses` | 反合理化 |
| 毒舌4.0 | `Stage 1 (Spec compliance) → Stage 2 (Code quality)` | 两阶段 |

**执行流程**：
1. **Stage 1（Spec 合规）**：逐条对照 Spec，检查是否漏实现/多做
2. 如果 Stage 1 有 HIGH 问题 → 停在 Stage 1，返回 bug-fixer
3. **Stage 2（代码质量）**：五轴评审（正确性、可读性、测试覆盖、安全、性能）
4. 输出审查报告 + 问题清单
5. 通过后自动 commit

---

## 与原版的差异

| 维度 | 毒舌产品经理4.0（完整版） | 简化版（Trae Solo） |
|------|-------------------------|-------------------|
| Skill 数量 | 8 个 | 5 个核心 |
| Hook 脚本 | 6 个自动化 Hook | 手动检查清单（Trae 无原生 Hook） |
| Sub-Agent | 4 个独立实例 | Trae Agent 模式天然隔离 |
| MCP 设计工具集成 | Figma/Pencil MCP | 手动设计稿引用 |
| 自动化闭环 | Review → Fix 自动循环 | 手动触发审查和修复 |

---

## 实施步骤

### Step 1: 创建项目目录结构

```
harness-framework/
├── .trae/
│   └── skills/
│       ├── product-spec-builder/
│       │   └── SKILL.md
│       ├── design-brief-builder/
│       │   └── SKILL.md
│       ├── dev-planner/
│       │   └── SKILL.md
│       ├── dev-builder/
│       │   └── SKILL.md
│       └── code-reviewer/
│           └── SKILL.md
├── docs/
│   ├── specs/              # 产品需求文档
│   ├── design/             # 设计文档
│   ├── plans/              # 开发计划
│   └── feedback/           # 反馈记录
│       └── FEEDBACK-INDEX.md
├── AGENTS.md               # 项目级 AI 操作手册
└── EVOLUTION.md            # 进化规则记录
```

### Step 2: 编写 AGENTS.md（总控文件）

定义项目整体规范，包括：
- 项目描述和技术栈
- 开发工作流（Spec → Design → Plan → Code → Review）
- 设计优先级规则（设计稿 > Design Brief > Product Spec）
- 代码规范和质量标准
- Context 管理规则（每个 Phase 重新读文档）
- Skill 调用说明
- 参考成熟方案：addyosmani/agent-skills 的 routing meta-skill 设计

### Step 3: 编写 5 个核心 Skill

按照上面"基于成熟方案优化的 Skill 设计"部分，逐个编写 SKILL.md 文件。

每个 SKILL.md 包含：
- YAML 元数据（name, description, version）
- 任务目标与触发条件
- 反模式防御（Anti-Patterns）
- 执行流程（分步骤）
- 输出格式
- 错误处理
- 使用示例（Few-shot）

### Step 4: 编写反馈与进化系统

#### 4.1 docs/feedback/FEEDBACK-INDEX.md

- 反馈记录索引
- 每条反馈包含：时间、场景、反馈内容、出现次数、处理状态

#### 4.2 EVOLUTION.md

- 进化规则记录
- 规则分级：临时记忆 → 正式规则（出现 3 次+）
- Skill 优化建议记录
- 新 Skill 提案记录

### Step 5: 编写使用指南

创建 `.trae/documents/harness-usage-guide.md`，包含：
- 快速开始指南
- 完整工作流演示（从想法到代码的完整流程）
- 每个 Skill 的触发方式和预期输出
- Context 管理最佳实践
- 常见问题和排查

---

## 文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `AGENTS.md` | 配置 | 项目级 AI 操作手册 |
| `.trae/skills/product-spec-builder/SKILL.md` | Skill | 需求收集 Skill |
| `.trae/skills/design-brief-builder/SKILL.md` | Skill | 设计规范 Skill |
| `.trae/skills/dev-planner/SKILL.md` | Skill | 开发计划 Skill |
| `.trae/skills/dev-builder/SKILL.md` | Skill | 代码开发 Skill |
| `.trae/skills/code-reviewer/SKILL.md` | Skill | 代码审查 Skill |
| `docs/feedback/FEEDBACK-INDEX.md` | 数据 | 反馈索引 |
| `EVOLUTION.md` | 数据 | 进化规则 |
| `.trae/documents/harness-usage-guide.md` | 文档 | 使用指南 |

---

## 预期效果

完成搭建后，用户可以：
1. 用自然语言描述产品想法 → 自动生成结构化 PRD
2. 定义视觉偏好 → 生成量化设计规范
3. 自动生成开发计划（Phase + Task 拆分）
4. 按 Task 逐步编码，每个 Task 有编译验证
5. 自动代码审查（Spec 合规 + 代码质量）
6. 反馈自动记录，重复问题自动升级为规则

## 迭代路线

| 版本 | 目标 | 新增内容 |
|------|------|---------|
| v1.0 | 核心工作流 | 5 个基础 Skill + AGENTS.md |
| v1.1 | TDD 强化 | dev-builder 增加测试驱动流程 |
| v1.2 | 进化系统 | feedback + evolution 自动化 |
| v2.0 | 完整 Harness | 补充 release-builder、bug-fixer 等 |
