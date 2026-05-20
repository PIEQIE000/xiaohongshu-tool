# EVOLUTION.md

从反馈中提炼的工程规则，违反必出错，必须遵守。

---

## 规则 1：新建文件前必须参考同类文件

**触发场景**：新增 API route、组件、工具函数等任何文件

**规则**：写新文件前，先看同目录下一个已有文件，确认：
- 导入方式（named export vs default export）
- 导出格式（export default vs export function）
- 引用的工具库（prisma、openai 等）的导入写法

**原因**：项目内不同文件的导入方式可能不一致。不检查就直接写，一个符号差异导致 API 全崩。

**已知雷区**：
- `@/lib/prisma` 导出的是 `{ prisma }`（named export），不是 `prisma`（default export）

---

## 规则 2：所有 API Route 必须使用统一错误处理

**触发场景**：新增任何 `/api/*/route.ts`

**规则**：每个 API handler 必须包含：
1. `try/catch` 包裹核心逻辑
2. catch 中 `console.error` 输出具体错误信息
3. 返回 `{ error: err?.message }` 和对应的 HTTP status

```typescript
export async function POST(request: Request) {
  try {
    // 核心逻辑
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("[API_NAME] ERROR:", err?.message)
    return NextResponse.json(
      { error: err?.message || "操作失败" },
      { status: err?.status || 500 }
    )
  }
}
```

**原因**：不加 try/catch 的 API 出错后只返回 500，没有任何日志，无法定位问题。

---

## 规则 3：改 Prisma Schema 必须先停服务器

**触发场景**：修改 `prisma/schema.prisma` 中的模型定义

**规则**：严格按照以下顺序执行：
1. 停止 Next.js 开发服务器
2. 修改 `prisma/schema.prisma`
3. `npx prisma db push`（SQLite 用 push，不用 migrate）
4. `npx prisma generate`
5. 重启开发服务器

**原因**：Prisma Client 的 `.dll` 文件被 Next.js 运行时占用，服务器运行时 generate 会报 `EPERM: operation not permitted`。停服 → push → generate → 重启 是最可靠的流程。