"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, UserPlus, Trash2, Loader2 } from "lucide-react"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      if (Array.isArray(data)) setUsers(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleAdd = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      setError("请输入有效邮箱")
      return
    }
    setError("")
    setAdding(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewEmail("")
        fetchUsers()
      } else {
        setError(data.error || "添加失败")
      }
    } catch {
      setError("添加失败，请重试")
    }
    setAdding(false)
  }

  const handleRemove = async (id: string) => {
    if (!confirm("确定要移除此用户吗？")) return
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" })
      fetchUsers()
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-violet-600" />
        <h2 className="text-lg font-semibold">用户管理</h2>
      </div>

      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="输入邮箱添加用户"
          value={newEmail}
          onChange={(e) => { setNewEmail(e.target.value); setError("") }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1"
        />
        <Button
          onClick={handleAdd}
          disabled={adding || !newEmail}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        </Button>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">加载中...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无用户</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-sm font-medium">{u.email}</p>
                <p className="text-xs text-muted-foreground">
                  {u.role === "admin" ? "管理员" : "用户"} · {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(u.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}