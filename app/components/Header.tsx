"use client";

import { formatKoreanDate } from "../lib/date";
import type { ThemeMode } from "../lib/types";
import SettingsMenu from "./SettingsMenu";
import ThemeToggle from "./ThemeToggle";

interface Props {
  selectedDate: string;
  readOnly: boolean;
  isFuture: boolean;
  themeMode: ThemeMode;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenDatePopup: () => void;
  onCycleTheme: () => void;
  onExport: () => string;
  onImport: (text: string) => void;
}

const navBtn =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-lg leading-none hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:hover:bg-neutral-800";

export default function Header({
  selectedDate,
  readOnly,
  isFuture,
  themeMode,
  onPrevDay,
  onNextDay,
  onOpenDatePopup,
  onCycleTheme,
  onExport,
  onImport,
}: Props) {
  return (
    <header className="mb-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="whitespace-nowrap text-lg font-bold tracking-tight sm:text-xl">
          미니다이어리
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDatePopup}
            aria-label="다이어리 날짜 선택"
            className={navBtn}
          >
            📅
          </button>
          <ThemeToggle mode={themeMode} onCycle={onCycleTheme} />
          <SettingsMenu onExport={onExport} onImport={onImport} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button type="button" onClick={onPrevDay} aria-label="이전 날" className={navBtn}>
          ‹
        </button>
        <h2 className="whitespace-nowrap text-base font-semibold tracking-tight sm:text-lg">
          {formatKoreanDate(selectedDate)}
        </h2>
        <button
          type="button"
          onClick={onNextDay}
          aria-label="다음 날"
          className={navBtn}
        >
          ›
        </button>
        {readOnly && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            지난 기록 · 읽기 전용
          </span>
        )}
        {isFuture && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-400">
            예정 · 계획 모드
          </span>
        )}
      </div>
    </header>
  );
}
