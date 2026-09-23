"use client";

import { useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { useDiaryContext } from "../lib/DiaryContext";
import { todayStr } from "../lib/date";
import { updateNicknameSchema, updatePasswordSchema } from "../lib/schemas";

interface Props {
  email: string;
  nickname: string;
}

const fieldClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-900";
const cardClass =
  "space-y-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900";

export default function AccountForm({ email, nickname: initialNickname }: Props) {
  const diary = useDiaryContext();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(initialNickname);
  const [nicknameMsg, setNicknameMsg] = useState<string | null>(null);
  const [nicknameSubmitting, setNicknameSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [dataMsg, setDataMsg] = useState<string | null>(null);

  const submitNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setNicknameMsg(null);
    const parsed = updateNicknameSchema.safeParse({ nickname });
    if (!parsed.success) {
      setNicknameMsg(parsed.error.issues[0]?.message ?? "닉네임을 확인해 주세요.");
      return;
    }
    setNicknameSubmitting(true);
    try {
      const res = await fetch("/api/account/nickname", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      setNicknameMsg(
        res.ok
          ? "닉네임이 변경됐습니다. (다음 로그인부터 완전히 반영돼요)"
          : "닉네임 변경에 실패했습니다."
      );
    } finally {
      setNicknameSubmitting(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    const parsed = updatePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      setPasswordMsg(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setPasswordSubmitting(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        setPasswordMsg("비밀번호가 변경됐습니다.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setPasswordMsg(
          body?.error === "WRONG_PASSWORD"
            ? "현재 비밀번호가 올바르지 않습니다."
            : "비밀번호 변경에 실패했습니다."
        );
      }
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleExport = () => {
    const json = diary.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mini-diary-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      if (!window.confirm("가져오면 현재 데이터를 덮어씁니다. 계속할까요?")) return;
      diary.importJSON(text);
      setDataMsg("가져오기 완료");
    } catch (e) {
      setDataMsg(e instanceof Error ? e.message : "가져오기에 실패했습니다.");
    } finally {
      window.setTimeout(() => setDataMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <p className="text-xs font-semibold text-neutral-500">이메일</p>
        <p className="text-sm">{email}</p>
      </div>

      <form onSubmit={submitNickname} className={cardClass}>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-neutral-500">닉네임</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className={fieldClass}
          />
        </label>
        {nicknameMsg && <p className="text-xs text-neutral-500">{nicknameMsg}</p>}
        <button
          type="submit"
          disabled={nicknameSubmitting || !nickname}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          닉네임 변경
        </button>
      </form>

      <form onSubmit={submitPassword} className={cardClass}>
        <p className="text-xs font-semibold text-neutral-500">비밀번호 변경</p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-neutral-500">현재 비밀번호</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-neutral-500">새 비밀번호</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="6자 이상"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-neutral-500">새 비밀번호 확인</span>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className={fieldClass}
          />
        </label>
        {passwordMsg && <p className="text-xs text-neutral-500">{passwordMsg}</p>}
        <button
          type="submit"
          disabled={passwordSubmitting || !currentPassword || !newPassword || !confirmNewPassword}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          비밀번호 변경
        </button>
      </form>

      <div className={cardClass}>
        <p className="text-xs font-semibold text-neutral-500">데이터</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
          >
            JSON 내보내기
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
          >
            JSON 가져오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {dataMsg && <p className="text-xs text-neutral-500">{dataMsg}</p>}
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
      >
        로그아웃
      </button>
    </div>
  );
}
