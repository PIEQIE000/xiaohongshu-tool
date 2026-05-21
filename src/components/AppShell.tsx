"use client"

import { useState } from "react"
import { Sidebar } from "@/components/Sidebar"
import { Menu } from "lucide-react"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-12 flex items-center px-4 border-b border-border bg-white sticky top-0 z-30">
          <button
            className="p-1 -ml-1 rounded hover:bg-gray-100"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-2 font-bold text-primary text-sm">内容运营工具</span>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}