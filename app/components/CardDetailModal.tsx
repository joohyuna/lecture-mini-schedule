"use client";

import { cn } from "../lib/cn";
import {
  CATEGORY_META,
  MAX_ITEMS_PER_CARD,
  type Category,
  type DiaryItem,
} from "../lib/types";
import ItemRow from "./ItemRow";
import Sheet from "./Sheet";

interface Props {
  open: boolean;
  category: Category;
  items: DiaryItem[];
  readOnly: boolean;
  onClose: () => void;
  onAdd: (category: Category) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export default function CardDetailModal({
  open,
  category,
  items,
  readOnly,
  onClose,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const meta = CATEGORY_META[category];
  const full = items.length >= MAX_ITEMS_PER_CARD;

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={`${meta.label} 전체 보기`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2 rounded-full", meta.dot)}
            aria-hidden="true"
          />
          <h2 className="break-keep text-base font-bold">{meta.label}</h2>
          <span className="break-keep text-xs text-neutral-400">{meta.sub}</span>
          <span className="shrink-0 text-xs text-neutral-400">
            {items.length}/{MAX_ITEMS_PER_CARD}
          </span>
        </div>
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

      <ul className="flex-1 space-y-0.5">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            isDont={meta.isDont}
            readOnly={readOnly}
            wide
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {items.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-neutral-400">
            기록 없음
          </li>
        )}
      </ul>

      {!readOnly && (
        <button
          type="button"
          onClick={() => onAdd(category)}
          disabled={full}
          className={cn(
            "mt-3 rounded-md border border-dashed px-3 py-1.5 text-xs transition",
            full
              ? "cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600"
              : "border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          )}
        >
          {full ? "카드당 최대 10개" : "+ 추가"}
        </button>
      )}
    </Sheet>
  );
}
