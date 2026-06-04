import { middlewareAuth } from "@/lib/auth.config"
import { NextResponse } from "next/server"

export default middlewareAuth((req) => {
  const { pathname } = req.nextUrl

  // 白名单：登录页、API 路由、静态资源
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // 未登录跳转登录页
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}