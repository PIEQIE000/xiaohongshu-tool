# Design Brief: 小红书铝单板内容运营工具

## 1. 整体调性
- **关键词**：专业、高效、前沿科技感、柔和现代
- **参考产品**：Cursor、Arc Browser、Vercel Dashboard
- **设计语言**：Notion 式亮色背景 + Cursor 式紫罗兰主色 + Linear 式信息密度

## 2. 配色方案

### 2.1 主色
- 色值：`#7C3AED`（Violet 600）
- 用途：主导航、品牌标识、一级强调

### 2.2 辅色
- 页面背景：`#FAFAFA`（Warm White）
- 卡片背景：`#FFFFFF`
- 分割线：`#E5E7EB`（Gray 200）
- 侧栏背景：`#F3F4F6`（Gray 100）

### 2.3 强调色
- 按钮/链接高亮：`#6D28D9`（Violet 700）
- Hover 状态：`#5B21B6`（Violet 800）
- 成功状态：`#10B981`（Emerald 500）
- 警告状态：`#F59E0B`（Amber 500）
- 错误状态：`#EF4444`（Red 500）
- 信息状态：`#6366F1`（Indigo 500）

### 2.4 文字色
- 主文字：`#111827`（Gray 900）
- 二级文字：`#6B7280`（Gray 500）
- 辅助文字：`#9CA3AF`（Gray 400）
- 禁用文字：`#D1D5DB`（Gray 300）
- 链接文字：`#7C3AED`（Violet 600）

## 3. 字体规范
- 标题字体：系统字体栈（`-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`），字重 600-700
- 正文字体：同上，字重 400，行高 1.6
- 代码字体：`"SF Mono", "Fira Code", "Cascadia Code", monospace`
- 字号层级：
  - H1：24px / 700
  - H2：20px / 600
  - H3：16px / 600
  - 正文：14px / 400
  - 辅助：12px / 400
  - 标签：11px / 500

## 4. 布局规范
- 页面宽度：侧栏 240px + 主内容区自适应（最大 1440px）
- 栅格系统：Flex/Grid，4 列响应式
- 间距系统：4px 为基础单位，4 / 8 / 12 / 16 / 20 / 24 / 32 / 48
- 内容区内边距：24px

## 5. 组件风格

### 5.1 按钮
- 主按钮（实心填充）：Violet 600 背景 + 白色文字 + 8px 圆角 + 微阴影
- 次按钮（描边）：透明背景 + Violet 600 边框（1px）+ Violet 600 文字 + 8px 圆角
- 幽灵按钮：透明背景 + 无边框 + 灰色文字
- 高度：36px（标准）/ 32px（小）
- 字重：500

### 5.2 卡片
- 圆角：16px
- 阴影：`0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)`
- 边框：无（用阴影区分层级）
- Hover 状态：阴影加深 + 轻微上浮 2px

### 5.3 输入框
- 样式：填充式（Gray 50 背景 + 1px Gray 200 边框）
- 圆角：8px
- 高度：40px
- 聚焦状态：Violet 600 边框 + 淡 Violet 光晕
- 错误状态：Red 500 边框

### 5.4 标签/Tag
- 圆角：全圆角（999px）
- 背景：Violet 50
- 文字：Violet 700
- 字号：11px
- 内边距：4px 8px

### 5.5 导航侧栏
- 背景：Gray 50
- 选中项：Violet 50 背景 + Violet 700 左边框（3px）
- 图标：Gray 500，选中时 Violet 600
- 宽度：240px 固定

## 6. 动效规范
- 级别：微妙动效
- 过渡时长：200ms
- 缓动函数：`ease-out`（入场）/ `ease-in`（退场）
- 适用场景：
  - Hover：背景色/阴影过渡 200ms ease-out
  - 按钮点击：scale(0.98) 100ms
  - 页面切换：淡入淡出 200ms ease-out
  - 卡片 Hover：translateY(-2px) + 阴影加深 200ms ease-out
  - 模态框弹出：scale + fade 200ms ease-out

## 7. 页面结构
- **左侧导航栏**：Logo + 功能菜单（选题管理 / 内容创作 / 排期日历 / 素材库 / 数据复盘 / Prompt 模板 / 设置）
- **顶部栏**：面包屑 + 全局搜索 + 用户头像
- **主内容区**：根据功能模块切换
