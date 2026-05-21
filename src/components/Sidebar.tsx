"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SidebarProps {
  className?: string
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ className, open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: "选题管理", href: "/topics" },
    { label: "内容创作", href: "/content" },
    { label: "排期日历", href: "/schedule" },
    { label: "素材库", href: "/materials" },
    { label: "拍摄任务", href: "/tasks" },
    { label: "数据复盘", href: "/analytics" },
    { label: "策略建议", href: "/strategy" },
    { label: "Prompt 模板", href: "/prompt-templates" },
    { label: "设置", href: "/settings" },
  ]

  const handleNav = (e: React.MouseEvent, href: string) => {
    if (pathname === href || pathname.startsWith(href)) return
    onClose?.()
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "bg-gray-50 border-r border-border flex flex-col h-screen z-50",
          "fixed inset-y-0 left-0 w-60 transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="h-14 flex items-center justify-between px-5 border-b border-border">
          <span className="text-lg font-bold text-primary">内容运营工具</span>
          <button
            className="md:hidden p-1 rounded hover:bg-gray-200"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNav(e, item.href)}
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
    </>
  )
}