# Dev Plan: 云端部署

## Phase 1: 基础设施配置

### Task 1.1: 安装依赖
- 安装 next-auth@beta, @auth/prisma-adapter, @libsql/client, resend
- 验证 TypeScript 编译通过
- **验证**：`npm ls` 确认依赖已安装

### Task 1.2: 配置 Prisma 适配 Turso
- 修改 `prisma/schema.prisma` 为 `@prisma/client` + `@libsql/client`
- 添加 User、VerificationToken 等认证模型
- 运行 `prisma db push` 同步到 Turso
- **验证**：`prisma db push` 成功

### Task 1.3: 配置 NextAuth
- 创建 `src/lib/auth.ts`（NextAuth 配置 + Email Provider）
- 创建 `src/app/api/auth/[...nextauth]/route.ts`
- 创建登录中间件 `src/middleware.ts`
- 配置 Resend 邮件发送
- **验证**：访问 `/api/auth/signin` 返回登录页

### Task 1.4: 环境变量配置
- 创建 `.env.example` 模板
- 配置 `TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`、`AUTH_SECRET`、`AUTH_RESEND_KEY`、`AUTH_EMAIL_FROM`
- **验证**：环境变量加载正确

## Phase 2: 登录页面

### Task 2.1: 创建登录页面
- 创建 `src/app/login/page.tsx`
- 邮箱输入 → 发送验证码 → 验证码输入 → 登录
- 倒计时 60s 重发
- 错误提示
- **验证**：页面渲染正常，输入邮箱 → 收到邮件 → 输入验证码 → 登录成功

### Task 2.2: 路由保护
- 中间件拦截未登录请求
- 登录页白名单
- 登录后重定向到首页
- **验证**：未登录访问任意页面 → 跳转登录页；登录后正常访问

## Phase 3: 用户管理

### Task 3.1: 用户管理页面
- 在设置页新增"用户管理"卡片
- 用户列表展示
- 添加用户弹窗
- 移除用户确认
- **验证**：查看用户列表、添加/移除用户

### Task 3.2: 用户管理 API
- `GET /api/users` 获取用户列表
- `POST /api/users` 添加用户
- `DELETE /api/users/:id` 移除用户
- **验证**：API 返回正确数据

## Phase 4: 图片存储适配

### Task 4.1: 图片上传改为 Base64 存储
- 修改上传 API，图片转 Base64 存入 Turso 数据库
- 修改图片显示组件，从 Base64 渲染
- 兼容旧的 `/public/uploads` 路径
- **验证**：上传新图片 → 显示正常；旧图片正常显示

### Task 4.2: 数据迁移脚本
- 创建数据迁移脚本，将本地 SQLite 数据导出
- 导入到 Turso 云数据库
- **验证**：迁移后数据完整，功能正常

## Phase 5: Vercel 部署

### Task 5.1: Vercel 部署配置
- 创建 `vercel.json` 配置
- 推送到 GitHub
- 在 Vercel 关联项目
- 配置环境变量
- 配置自定义域名
- **验证**：部署成功，域名可访问，所有功能正常