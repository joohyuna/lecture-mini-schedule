"use client";

import { useMemo } from "react";
import { cn } from "../../lib/cn";
import { daysBetween, todayStr } from "../../lib/date";
import { useDiaryContext } from "../../lib/DiaryContext";
import { CATEGORY_META, type Category } from "../../lib/types";

const RATE_CATEGORIES: Category[] = ["longterm", "donow", "extra"];

export default function StatsPage() {
  const diary = useDiaryContext();
  const today = todayStr();
  const monthPrefix = today.slice(0, 7);
  const monthLabel = `${today.slice(0, 4)}년 ${Number(today.slice(5, 7))}월`;

  const monthItems = useMemo(
    () => diary.items.filter((it) => it.date.startsWith(monthPrefix)),
    [diary.items, monthPrefix]
  );

  const rates = useMemo(() => {
    return RATE_CATEGORIES.map((category) => {
      const items = monthItems.filter((it) => it.category === category);
      const done = items.filter((it) => it.status === "done").length;
      const rate = items.length > 0 ? Math.round((done / items.length) * 100) : null;
      return { category, total: items.length, done, rate };
    });
  }, [monthItems]);

  const dont = useMemo(() => {
    const items = monthItems.filter((it) => it.category === "dont");
    const broken = items.filter((it) => it.status === "broken").length;
    const kept = items.length - broken;
    return { total: items.length, kept, broken };
  }, [monthItems]);

  const streakDays = useMemo(() => {
    const dontItems = diary.items.filter((it) => it.category === "dont");
    if (dontItems.length === 0) return null;
    const brokenDates = dontItems
      .filter((it) => it.status === "broken")
      .map((it) => it.date)
      .sort();

    if (brokenDates.length > 0) {
      // 마지막으로 어긴 날부터 오늘까지 며칠 지났는지(어긴 날 자체는 포함 안 함)
      return Math.max(daysBetween(brokenDates.at(-1)!, today), 0);
    }
    // 어긴 적이 없으면 Don't 카테고리 최초 기록일부터(그날 포함) 오늘까지
    const firstDate = dontItems.map((it) => it.date).sort()[0];
    return daysBetween(firstDate, today) + 1;
  }, [diary.items, today]);

  if (!diary.ready) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 text-sm text-neutral-400">
        불러오는 중…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-lg font-bold tracking-tight sm:text-xl">통계</h1>
      <p className="mb-4 text-sm font-semibold text-neutral-500">{monthLabel} 요약</p>

      <div className="space-y-3">
        {rates.map(({ category, total, done, rate }) => (
          <div
            key={category}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <span
                className={cn("size-2 rounded-full", CATEGORY_META[category].dot)}
                aria-hidden="true"
              />
              {CATEGORY_META[category].label}
            </span>
            <span className="text-sm text-neutral-500">
              {total === 0 ? (
                "기록 없음"
              ) : (
                <>
                  완료율 <strong className="text-neutral-900 dark:text-neutral-100">{rate}%</strong>
                  <span className="ml-1 text-neutral-400">
                    ({done}/{total})
                  </span>
                </>
              )}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className={cn("size-2 rounded-full", CATEGORY_META.dont.dot)} aria-hidden="true" />
            {CATEGORY_META.dont.label}
          </span>
          <span className="text-sm text-neutral-500">
            {dont.total === 0 ? (
              "기록 없음"
            ) : (
              <>
                지킴 <strong className="text-neutral-900 dark:text-neutral-100">{dont.kept}</strong>일 ·
                어김 <strong className="text-rose-500">{dont.broken}</strong>일
              </>
            )}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <span className="text-sm font-medium">🔥 현재 연속 지킴</span>
        <span className="ml-2 text-sm text-neutral-500">
          {streakDays === null ? (
            "아직 기록 없음"
          ) : (
            <>
              <strong className="text-neutral-900 dark:text-neutral-100">{streakDays}</strong>일째
            </>
          )}
        </span>
      </div>
    </main>
  );
}
