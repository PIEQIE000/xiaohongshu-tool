"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[global-error]", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold">页面加载出错</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "发生了意外错误，请重试"}
        </p>
        <Button onClick={() => reset()} variant="outline">
          重试
        </Button>
      </div>
    </div>
  )
}