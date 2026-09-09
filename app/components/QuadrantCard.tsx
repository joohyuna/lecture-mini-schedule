"use client";

import { cn } from "../lib/cn";
import {
  CARRYABLE,
  CATEGORY_META,
  MAX_ITEMS_PER_CARD,
  type Category,
  type DiaryItem,
} from "../lib/types";
import { formatShortDate } from "../lib/date";
import ItemRow from "./ItemRow";

interface Props {
  category: Category;
  items: DiaryItem[];
  readOnly: boolean;
  priorDate: string | null;
  onAdd: (category: Category) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onCarry: (category: Category) => void;
}

export default function QuadrantCard({
  category,
  items,
  readOnly,
  priorDate,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
  onCarry,
}: Props) {
  const meta = CATEGORY_META[category];
  const full = items.length >= MAX_ITEMS_PER_CARD;
  const canCarry =
    !readOnly && CARRYABLE.includes(category) && items.length === 0 && !!priorDate;

  const kept = items.filter((it) => it.status !== "broken").length;
  const brokenCount = items.filter((it) => it.status === "broken").length;

  return (
    <section className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 md:w-[calc(50%-0.5rem)] dark:border-neutral-800 dark:bg-neutral-900">
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden="true" />
          <h2 className="font-semibold">{meta.label}</h2>
          <span className="text-xs text-neutral-400">{meta.sub}</span>
        </div>
        <span className="shrink-0 text-xs text-neutral-400">
          {meta.isDont
            ? `${kept} 지킴 · ${brokenCount} 어김`
            : `${items.length}/${MAX_ITEMS_PER_CARD}`}
        </span>
      </header>

      <ul className="max-h-72 flex-1 space-y-0.5 overflow-y-auto">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            isDont={meta.isDont}
            readOnly={readOnly}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {items.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-neutral-400">
            {readOnly ? (
              "기록 없음"
            ) : canCarry ? (
              <div className="space-y-2">
                <p>{formatShortDate(priorDate!)}의 항목이 있어요.</p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCarry(category)}
                    className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                  >
                    지난 항목 불러오기
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdd(category)}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
                  >
                    직접 적기
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(category)}
                className="rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                + 항목 추가
              </button>
            )}
          </li>
        )}
      </ul>

      {!readOnly && items.length > 0 && (
        <button
          type="button"
          onClick={() => onAdd(category)}
          disabled={full}
          className={cn(
            "mt-2 rounded-md border border-dashed px-3 py-1.5 text-xs transition",
            full
              ? "cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600"
              : "border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          )}
        >
          {full ? "카드당 최대 10개" : "+ 항목 추가"}
        </button>
      )}
    </section>
  );
}
