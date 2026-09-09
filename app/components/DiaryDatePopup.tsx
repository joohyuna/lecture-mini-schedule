"use client";

import { useEffect } from "react";
import { todayStr } from "../lib/date";
import type { DayMeta } from "../lib/types";
import MonthCalendar from "./MonthCalendar";

interface Props {
  open: boolean;
  selectedDate: string;
  dayMeta: Record<string, DayMeta>;
  onClose: () => void;
  onPick: (date: string) => void;
}

export default function DiaryDatePopup({
  open,
  selectedDate,
  dayMeta,
  onClose,
  onPick,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const today = todayStr();
  const pick = (date: string) => {
    onPick(date);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="날짜 선택"
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">다이어리</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <MonthCalendar
          selectedDate={selectedDate}
          dayMeta={dayMeta}
          onPick={pick}
        />

        {selectedDate !== today && (
          <button
            type="button"
            onClick={() => pick(today)}
            className="mt-3 w-full rounded-lg border border-neutral-300 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
          >
            오늘로 이동
          </button>
        )}
      </div>
    </div>
  );
}
