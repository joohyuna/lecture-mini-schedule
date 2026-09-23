import Link from "next/link";
import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="mb-6 text-center text-lg font-bold tracking-tight">
        미니다이어리 로그인
      </h1>
      <AuthForm mode="login" />
      <p className="mt-4 text-center text-xs text-neutral-500">
        계정이 없으신가요?{" "}
        <Link href="/register" className="font-medium underline">
          회원가입
        </Link>
      </p>
    </main>
  );
}
