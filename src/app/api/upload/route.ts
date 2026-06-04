import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Vercel 生产环境使用 Base64 存储
  if (process.env.VERCEL) {
    const mime = file.type || "image/jpeg"
    const base64 = buffer.toString("base64")
    return NextResponse.json({ url: `data:${mime};base64,${base64}`, name: file.name })
  }

  // 本地开发写文件系统
  const uploadsDir = join(process.cwd(), "public", "uploads")
  await mkdir(uploadsDir, { recursive: true })

  const filePath = join(uploadsDir, file.name)
  await writeFile(filePath, buffer)

  return NextResponse.json({ url: `/uploads/${file.name}`, name: file.name })
}