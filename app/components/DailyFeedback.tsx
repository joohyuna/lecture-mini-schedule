"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  readOnly: boolean;
  onSave: (text: string) => void;
}

// 부모에서 key={selectedDate} 로 렌더 → 날짜가 바뀌면 새로 마운트되어 draft 초기화됨
export default function DailyFeedback({ value, readOnly, onSave }: Props) {
  const [draft, setDraft] = useState(value);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const dirty = draft !== value;

  const save = () => {
    onSave(draft);
    setSavedAt(Date.now());
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSavedAt(null), 2000);
  };

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">
          하루의 피드백
          <span className="ml-2 text-xs font-normal text-neutral-400">
            오늘 하루 회고
          </span>
        </h2>
        {!readOnly && (
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            메모
          </button>
        )}
      </div>

      <textarea
        value={draft}
        readOnly={readOnly}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={readOnly ? "기록 없음" : "오늘 하루를 돌아보며 한 줄 남겨보세요"}
        className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 read-only:bg-neutral-50 read-only:text-neutral-500 dark:border-neutral-600 dark:bg-neutral-900 dark:read-only:bg-neutral-950"
      />

      {savedAt && (
        <p className="mt-1 text-right text-[11px] text-emerald-500">저장됨</p>
      )}
    </section>
  );
}
