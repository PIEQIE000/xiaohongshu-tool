# AGENTS.md - Harness Engineering 实践框架

## 项目概述

本项目是一套面向产品开发全流程的 Harness Engineering 框架，将 Vibe Coding 从"和 AI 聊天写代码"升级为可靠的产品开发系统。

**核心理念**：不是优化你怎么跟 AI 说话，而是搭建一整套约束、引导和反馈机制。

## 开发工作流

严格遵循以下流程，不可跳过任何阶段：

```
Product Spec → Design Brief → Dev Plan → Dev Build → Code Review
     ↓              ↓              ↓            ↓            ↓
  需求确认       视觉确认       计划确认     代码实现     质量审查
```

### 阶段说明

| 阶段 | 触发方式 | 产出物 | 验收标准 |
|------|---------|--------|---------|
| 1. Product Spec | 用户描述产品想法 | `docs/specs/YYYY-MM-DD-<topic>-spec.md` | 用户签字确认 |
| 2. Design Brief | Spec 确认后 | `docs/design/YYYY-MM-DD-<topic>-design-brief.md` | 用户签字确认 |
| 3. Dev Plan | Spec + Brief 确认后 | `docs/plans/YYYY-MM-DD-<topic>-dev-plan.md` | 用户确认计划 |
| 4. Dev Build | 计划确认后 | 代码文件 | 每个 Task 编译通过 + 测试通过 |
| 5. Code Review | 代码完成后 | 审查报告 | 两阶段审查通过 |

## 设计优先级规则

当设计出现冲突时，按以下优先级裁决：

1. **最高**：设计工具中的设计稿（Figma/Pencil）
2. **次之**：Design Brief 文档
3. **最后**：Product Spec 文档（功能逻辑）

## Context 管理规则

**关键原则**：每个 Phase 开始时，必须重新读取相关文档。

- 新 Phase 开始时：重新读取 Product Spec + Design Brief + Dev Plan
- 新 Task 开始时：只读取当前 Task 定义，不继承上一个 Task 的上下文
- Session 超时时：记录当前进度到 Dev Plan，下次从断点继续

## 代码规范

- 遵循项目已有的代码风格
- 每个函数/方法必须有清晰的命名
- 不要重构相邻系统，不要删除没完全理解的代码
- 每次变更范围尽量控制在 100 行以内

## Skill 调用说明

本框架包含 5 个 Skill，Trae Solo 会根据用户意图自动匹配：

| Skill 名称 | 触发场景 |
|-----------|---------|
| product-spec-builder | 用户描述产品想法、功能需求、项目启动 |
| design-brief-builder | 用户需要定义视觉规范、设计风格 |
| dev-planner | 拿到 PRD 后需要制定开发计划、任务拆解 |
| dev-builder | 按 Task 清单进行代码实现、功能开发 |
| code-reviewer | 代码完成后的质量检查、Spec 合规性验证 |

## 反模式防御

以下行为严格禁止：

1. **禁止跳过 Spec 直接写代码**：需求未明确前，不允许进入开发阶段
2. **禁止跳过 Design 直接写 UI**：没有设计规范时，不允许实现界面
3. **禁止跳过 Plan 直接写代码**：没有开发计划时，不允许开始编码
4. **禁止跳过 Review 直接提交**：代码未审查通过，不允许提交
5. **禁止一次改多处**：每次只修改一个逻辑点，便于定位问题

## 反馈记录

当用户给出修正意见或表达不满时，自动记录到 `docs/feedback/FEEDBACK-INDEX.md`。

同一条反馈出现 3 次以上，提议升级为正式规则写入 `EVOLUTION.md`。
