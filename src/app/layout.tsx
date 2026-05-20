import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import { Sidebar } from "@/components/Sidebar"

export const metadata: Metadata = {
  title: "小红书内容运营工具",
  description: "铝单板行业小红书内容生产与运营管理工具",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-screen">
            <Suspense fallback={<div className="p-6 text-muted-foreground">加载中...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </body>
    </html>
  )
}
