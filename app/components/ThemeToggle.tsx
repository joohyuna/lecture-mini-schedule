"use client";

import type { ThemeMode } from "../lib/types";

interface Props {
  mode: ThemeMode;
  onCycle: () => void;
}

const ICON: Record<ThemeMode, string> = {
  system: "🖥️",
  light: "☀️",
  dark: "🌙",
};

const LABEL: Record<ThemeMode, string> = {
  system: "시스템",
  light: "라이트",
  dark: "다크",
};

export default function ThemeToggle({ mode, onCycle }: Props) {
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`테마: ${LABEL[mode]} (눌러서 변경)`}
      title={`테마: ${LABEL[mode]}`}
      className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-base hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
    >
      <span aria-hidden="true">{ICON[mode]}</span>
    </button>
  );
}
