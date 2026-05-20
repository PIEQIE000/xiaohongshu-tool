"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: "选题管理", href: "/topics" },
    { label: "内容创作", href: "/content" },
    { label: "排期日历", href: "/schedule" },
    { label: "素材库", href: "/materials" },
    { label: "数据复盘", href: "/analytics" },
    { label: "Prompt 模板", href: "/prompt-templates" },
    { label: "设置", href: "/settings" },
  ]

  return (
    <aside className={cn("w-60 bg-gray-50 border-r border-border flex flex-col h-screen", className)}>
      <div className="h-14 flex items-center px-5 border-b border-border">
        <span className="text-lg font-bold text-primary">内容运营工具</span>
      </div>
      <nav className="flex-1 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-10 px-5 text-sm font-medium transition-colors border-l-[3px] border-transparent",
                isActive
                  ? "bg-violet-50 text-violet-700 border-l-violet-700"
                  : "text-gray-500 hover:text-foreground hover:bg-gray-100"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
