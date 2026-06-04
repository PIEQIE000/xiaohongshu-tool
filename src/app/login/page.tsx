"use client"

import { useState, useCallback, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Mail, ArrowRight } from "lucide-react"

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const isVerify = searchParams.get("verify") === "1"

  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [sent, setSent] = useState(isVerify)
  const [error, setError] = useState("")

  const startCountdown = useCallback(() => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setError("请输入有效的邮箱地址")
      return
    }
    setError("")
    setIsSending(true)
    try {
      const result = await signIn("resend", { email, redirect: false, callbackUrl })
      if (result?.error) {
        setError(result.error === "AccessDenied" ? "该邮箱未注册，请联系管理员" : "发送失败，请重试")
      } else {
        setSent(true)
        startCountdown()
      }
    } catch {
      setError("发送失败，请检查网络")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-[400px] rounded-2xl shadow-xl">
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">小红书运营工具</h1>
            <p className="text-sm text-gray-500 mt-1">登录后继续</p>
          </div>

          {sent ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                验证码已发送至 <span className="font-medium text-gray-900">{email}</span>
              </p>
              <p className="text-xs text-gray-400">请查收邮件并点击链接登录</p>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => { setSent(false); setCountdown(0) }}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s 后重发` : "重新发送"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  className="h-11"
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>

              <Button
                className="w-full h-11 bg-violet-600 hover:bg-violet-700"
                onClick={handleSendCode}
                disabled={isSending || !email}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {isSending ? "发送中..." : "发送验证码"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}