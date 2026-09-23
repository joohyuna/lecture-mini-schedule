"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema, registerSchema } from "../lib/schemas";

interface Props {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    const schema = mode === "login" ? loginSchema : registerSchema;
    const parsed = schema.safeParse(
      mode === "login" ? { email, password } : { email, nickname, password }
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(
            body?.error === "EMAIL_TAKEN"
              ? "이미 가입된 이메일입니다."
              : "가입에 실패했습니다."
          );
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
          이메일
        </span>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-900"
        />
      </label>

      {mode === "register" && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
            닉네임
          </span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="2~20자"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-900"
          />
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
          비밀번호
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "register" ? "6자 이상" : ""}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-900"
        />
      </label>

      {mode === "register" && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
            비밀번호 확인
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-900"
          />
        </label>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <button
        type="submit"
        disabled={
          submitting ||
          !email ||
          !password ||
          (mode === "register" && (!nickname || !confirmPassword))
        }
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
      >
        {mode === "login" ? "로그인" : "회원가입"}
      </button>
    </form>
  );
}
