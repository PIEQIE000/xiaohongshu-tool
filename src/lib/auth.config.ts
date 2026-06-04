import NextAuth from "next-auth"

// 用于 middleware 的轻量 auth 配置（仅 JWT 验证，不处理登录）
export const { auth: middlewareAuth } = NextAuth({
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
})