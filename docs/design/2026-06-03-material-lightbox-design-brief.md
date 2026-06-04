# Design Brief: 素材库图片浏览器

## 1. 设计范围
素材库新增图片浏览器（Lightbox）组件，包含全屏查看、分享、下载功能。

## 2. 配色方案
延续项目现有紫色系（violet）风格：
- 遮罩背景：`bg-black/90`（90% 不透明度纯黑）
- 主操作按钮：`bg-violet-600 text-white`
- 次要操作按钮：`bg-white/20 text-white`（半透明毛玻璃）
- 箭头图标：`text-white`，hover 时 `text-violet-300`
- 关闭按钮：`text-white/70 hover:text-white`

## 3. 组件结构

### 3.1 Lightbox 全屏浏览器
- 固定定位 `fixed inset-0 z-50`
- 深色遮罩背景
- 内容区域：居中显示图片，`max-w-[90vw] max-h-[85vh] object-contain`
- 图片下方显示当前序号：`3 / 12`（`text-white/60 text-sm`）

### 3.2 导航箭头
- 左右各一个圆形箭头按钮，`w-10 h-10 rounded-full`
- 背景 `bg-white/20 hover:bg-white/30`
- 位置：左右居中，距边缘 16px
- 首尾图片对应箭头 `opacity-30 pointer-events-none`

### 3.3 底部工具栏
- 固定在浏览器底部，`h-14`
- 背景 `bg-black/80`
- 按钮排列：分享（左）| 下载（左）| 关闭（右）
- 按钮样式：`text-white text-sm flex items-center gap-1.5`

### 3.4 手势滑动
- 手机端左右滑动切换图片
- 滑动阈值：拖动超过 50px 触发切换
- 切换动画：`transition-transform duration-300`

## 4. 交互状态
- 加载中：图片使用骨架屏占位
- 空状态：无图片时不显示浏览器入口
- 桌面端：分享按钮替换为下载按钮（Web Share API 不支持）
- 分享失败：toast 提示"分享失败，请尝试下载"

## 5. 响应式
- 桌面端：居中显示，箭头始终可见
- 手机端：箭头半透明靠边，手势滑动为主
- 底部工具栏全宽，按钮间距自适应