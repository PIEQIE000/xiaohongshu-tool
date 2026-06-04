// 种子脚本：创建第一个管理员用户
// 用法: npx tsx prisma/seed.ts
import { prisma } from "../src/lib/prisma"

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error("请设置 ADMIN_EMAIL 环境变量")
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existing) {
    console.log(`用户 ${adminEmail} 已存在`)
    return
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      role: "admin",
    },
  })
  console.log(`管理员用户 ${adminEmail} 创建成功`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())