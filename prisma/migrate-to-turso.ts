// 数据迁移脚本：从本地 SQLite 迁移到 Turso
// 用法：
// 1. 设置 TURSO_DATABASE_URL 和 TURSO_AUTH_TOKEN 环境变量
// 2. npx tsx prisma/migrate-to-turso.ts
import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (!tursoUrl || !tursoToken) {
    console.error("请设置 TURSO_DATABASE_URL 和 TURSO_AUTH_TOKEN 环境变量")
    process.exit(1)
  }

  console.log("连接本地数据库...")
  const localDb = new PrismaClient()

  console.log("连接 Turso...")
  const libsql = createClient({ url: tursoUrl, authToken: tursoToken })
  const adapter = new PrismaLibSql(libsql)
  const tursoDb = new PrismaClient({ adapter })

  try {
    // 迁移 Asset（素材）
    const assets = await localDb.asset.findMany()
    console.log(`找到 ${assets.length} 条素材数据`)
    for (const asset of assets) {
      await tursoDb.asset.upsert({
        where: { id: asset.id },
        create: asset,
        update: asset,
      })
    }
    console.log("素材迁移完成")

    // 迁移 Topic（选题）
    const topics = await localDb.topic.findMany()
    console.log(`找到 ${topics.length} 条选题数据`)
    for (const topic of topics) {
      await tursoDb.topic.upsert({
        where: { id: topic.id },
        create: topic,
        update: topic,
      })
    }
    console.log("选题迁移完成")

    // 迁移 Content（内容）
    const contents = await localDb.content.findMany()
    console.log(`找到 ${contents.length} 条内容数据`)
    for (const content of contents) {
      await tursoDb.content.upsert({
        where: { id: content.id },
        create: content,
        update: content,
      })
    }
    console.log("内容迁移完成")

    // 迁移其他表
    const models = ["calendarEntry", "metric", "promptTemplate", "materialSnippet", "materialTask", "contentStrategy", "shareLink"] as const
    for (const model of models) {
      const records = await (localDb as any)[model].findMany()
      console.log(`找到 ${records.length} 条 ${model} 数据`)
      for (const record of records) {
        await (tursoDb as any)[model].upsert({
          where: { id: record.id },
          create: record,
          update: record,
        })
      }
      console.log(`${model} 迁移完成`)
    }

    console.log("\n所有数据迁移完成！")
  } catch (err) {
    console.error("迁移失败:", err)
  } finally {
    await localDb.$disconnect()
    await tursoDb.$disconnect()
  }
}

main()