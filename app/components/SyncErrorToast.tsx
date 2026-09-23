"use client";

import { useEffect, useState } from "react";

/** storage.ts가 저장/불러오기 실패 시 던지는 이벤트를 전역에서 받아 알린다. */
export default function SyncErrorToast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const onSyncError = () => {
      setMsg("저장 실패 · 다시 시도해 주세요");
      window.setTimeout(() => setMsg(null), 3000);
    };
    window.addEventListener("mini-diary:sync-error", onSyncError);
    return () => window.removeEventListener("mini-diary:sync-error", onSyncError);
  }, []);

  if (!msg) return null;

  return (
    <p className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
      {msg}
    </p>
  );
}
