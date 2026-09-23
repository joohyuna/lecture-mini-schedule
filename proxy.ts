import NextAuth from "next-auth";
import { authConfig } from "@/app/lib/auth.config";

// Next 16 에서 `middleware` 는 `proxy` 로 이름이 바뀌었다.
// authConfig(prisma/bcrypt 없음)만 사용해 Edge 런타임에서 돈다.
export default NextAuth(authConfig).auth;

export const config = {
  // 모든 페이지 경로를 보호. /api/* 는 제외(각 route handler가 자체 401 처리) —
  // matcher에 /api/*를 넣으면 미인증 fetch가 307로 /login HTML을 반환하고
  // fetch()가 그 리다이렉트를 따라가 res.ok가 true인 채로 res.json()이 깨진다.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
