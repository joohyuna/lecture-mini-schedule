import type { NextAuthConfig } from "next-auth";

// Edge(proxy)에서도 안전하게 import 할 수 있는 최소 설정.
// prisma / bcryptjs 등 Node 전용 모듈을 여기서 import 하면 안 된다.
// 실제 Credentials provider(authorize)는 app/lib/auth.ts 에서 추가한다.

/** 로그인 없이 접근 가능한 경로 */
const PUBLIC_PATHS = ["/login", "/register"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // proxy.ts가 이 콜백으로 접근 허용 여부를 판단한다.
    // false 를 반환하면 Auth.js 가 pages.signIn 으로 리다이렉트한다.
    authorized({ auth, request: { nextUrl } }) {
      const isPublic = PUBLIC_PATHS.some(
        (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(`${p}/`)
      );
      if (isPublic) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
