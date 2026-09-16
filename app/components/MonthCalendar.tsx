"use client";

import { useState } from "react";
import { cn } from "../lib/cn";
import { monthLabel, monthMatrix, todayStr, WEEKDAYS } from "../lib/date";
import type { DayMeta } from "../lib/types";

interface Props {
  selectedDate: string;
  dayMeta: Record<string, DayMeta>;
  onPick: (date: string) => void;
}

export default function MonthCalendar({ selectedDate, dayMeta, onPick }: Props) {
  const today = todayStr();
  const [initYear, initMonth] = selectedDate.split("-").map(Number);
  const [view, setView] = useState({ y: initYear, m: initMonth });

  const shift = (delta: number) => {
    const base = new Date(view.y, view.m - 1 + delta, 1);
    setView({ y: base.getFullYear(), m: base.getMonth() + 1 });
  };

  const cells = monthMatrix(view.y, view.m);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="이전 달"
          className="flex size-8 items-center justify-center rounded-lg text-lg leading-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          ‹
        </button>
        <span className="text-sm font-semibold">
          {monthLabel(view.y, view.m)}
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="다음 달"
          className="flex size-8 items-center justify-center rounded-lg text-lg leading-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-neutral-400">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(i === 0 && "text-rose-400", i === 6 && "text-sky-400")}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {cells.map(({ date, inMonth }) => {
          const meta = dayMeta[date];
          const day = Number(date.split("-")[2]);
          const isToday = date === today;
          const isSelected = date === selectedDate;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onPick(date)}
              className={cn(
                "flex h-11 flex-col items-center justify-center rounded-lg text-sm transition",
                !inMonth && "text-neutral-300 dark:text-neutral-600",
                !isSelected &&
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                isSelected &&
                  "bg-neutral-800 font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900",
                isToday &&
                  !isSelected &&
                  "ring-1 ring-inset ring-neutral-400 dark:ring-neutral-500"
              )}
            >
              <span>{day}</span>
              <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                {meta?.total ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelected
                        ? "bg-white/70 dark:bg-neutral-900/70"
                        : "bg-neutral-400"
                    )}
                  />
                ) : null}
                {meta?.broken ? (
                  <span className="size-1.5 rounded-full bg-rose-500" />
                ) : null}
                {meta?.feedback ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelected
                        ? "bg-white/70 dark:bg-neutral-900/70"
                        : "bg-amber-400"
                    )}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-neutral-400" /> 기록
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-rose-500" /> 어김
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-amber-400" /> 피드백
        </span>
      </p>
    </div>
  );
}
