import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import { AppShell } from "@/components/AppShell"

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
        <AppShell>
          <Suspense fallback={<div className="p-6 text-muted-foreground">加载中...</div>}>
            {children}
          </Suspense>
        </AppShell>
      </body>
    </html>
  )
}
