"use client";

import { useState } from "react";
import { cn } from "../lib/cn";
import {
  CARD_MOBILE_VISIBLE_LIMIT,
  CARD_VISIBLE_LIMIT,
  CARRYABLE,
  CATEGORY_META,
  MAX_ITEMS_PER_CARD,
  type Category,
  type DiaryItem,
} from "../lib/types";
import { formatShortDate } from "../lib/date";
import ItemRow from "./ItemRow";
import CardDetailModal from "./CardDetailModal";

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
  const [detailOpen, setDetailOpen] = useState(false);

  const meta = CATEGORY_META[category];
  const full = items.length >= MAX_ITEMS_PER_CARD;
  const canCarry =
    !readOnly && CARRYABLE.includes(category) && items.length === 0 && !!priorDate;

  const kept = items.filter((it) => it.status !== "broken").length;
  const brokenCount = items.filter((it) => it.status === "broken").length;

  // 카드에는 최신(최근 생성) 순으로 최대 CARD_VISIBLE_LIMIT개만 보여주고,
  // 나머지는 "더보기" 팝업(CardDetailModal)에서 전체 목록으로 확인한다.
  const visibleItems = [...items]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, CARD_VISIBLE_LIMIT);

  return (
    <section className="flex w-[calc(50%-0.375rem)] flex-col rounded-xl border border-neutral-200 bg-white p-3 md:w-[calc(50%-0.5rem)] md:p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} aria-hidden="true" />
          <h2 className="break-keep font-semibold">{meta.label}</h2>
          <span className="hidden break-keep text-xs text-neutral-400 md:inline">
            {meta.sub}
          </span>
        </div>
        <span className="shrink-0 break-keep text-xs text-neutral-400">
          {meta.isDont
            ? `${kept} 지킴 · ${brokenCount} 어김`
            : `${items.length}/${MAX_ITEMS_PER_CARD}`}
        </span>
      </header>

      <ul className="flex-1 space-y-0.5">
        {visibleItems.map((item, idx) => (
          <ItemRow
            key={item.id}
            item={item}
            isDont={meta.isDont}
            readOnly={readOnly}
            hiddenOnMobile={idx >= CARD_MOBILE_VISIBLE_LIMIT}
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
                + 추가
              </button>
            )}
          </li>
        )}
      </ul>

      {items.length > 0 && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            더보기
          </button>

          {!readOnly && (
            <button
              type="button"
              onClick={() => onAdd(category)}
              disabled={full}
              className={cn(
                "flex-1 rounded-md border border-dashed px-3 py-1.5 text-xs transition",
                full
                  ? "cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600"
                  : "border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              )}
            >
              {full ? "카드당 최대 10개" : "+ 추가"}
            </button>
          )}
        </div>
      )}

      <CardDetailModal
        open={detailOpen}
        category={category}
        items={items}
        readOnly={readOnly}
        onClose={() => setDetailOpen(false)}
        onAdd={onAdd}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </section>
  );
}
