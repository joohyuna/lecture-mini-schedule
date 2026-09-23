import Link from "next/link";
import AuthForm from "../components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="mb-6 text-center text-lg font-bold tracking-tight">
        미니다이어리 회원가입
      </h1>
      <AuthForm mode="register" />
      <p className="mt-4 text-center text-xs text-neutral-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium underline">
          로그인
        </Link>
      </p>
    </main>
  );
}
