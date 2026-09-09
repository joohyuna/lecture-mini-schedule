"use client";

import { formatKoreanDate } from "../lib/date";
import type { ThemeMode } from "../lib/types";
import SettingsMenu from "./SettingsMenu";
import ThemeToggle from "./ThemeToggle";

interface Props {
  selectedDate: string;
  readOnly: boolean;
  canGoNext: boolean;
  themeMode: ThemeMode;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenDatePopup: () => void;
  onOpenAdd: () => void;
  onCycleTheme: () => void;
  onExport: () => string;
  onImport: (text: string) => void;
}

const navBtn =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-lg leading-none hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:hover:bg-neutral-800";

export default function Header({
  selectedDate,
  readOnly,
  canGoNext,
  themeMode,
  onPrevDay,
  onNextDay,
  onOpenDatePopup,
  onOpenAdd,
  onCycleTheme,
  onExport,
  onImport,
}: Props) {
  const today = !readOnly;

  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onPrevDay} aria-label="이전 날" className={navBtn}>
          ‹
        </button>
        <h1 className="whitespace-nowrap text-lg font-bold tracking-tight sm:text-xl">
          <span className="mr-1.5">📔</span>
          {formatKoreanDate(selectedDate)}
        </h1>
        <button
          type="button"
          onClick={onNextDay}
          disabled={!canGoNext}
          aria-label="다음 날"
          className={navBtn}
        >
          ›
        </button>
        {!today && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            지난 기록 · 읽기 전용
          </span>
        )}
        <button
          type="button"
          onClick={onOpenDatePopup}
          className="rounded-lg border border-neutral-200 px-2.5 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          📖 다이어리
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenAdd}
          disabled={!today}
          className="rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          + 입력
        </button>
        <ThemeToggle mode={themeMode} onCycle={onCycleTheme} />
        <SettingsMenu onExport={onExport} onImport={onImport} />
      </div>
    </header>
  );
}
