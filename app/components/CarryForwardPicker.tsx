"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { formatShortDate } from "../lib/date";
import { CATEGORY_META, type Category, type DiaryItem } from "../lib/types";
import Sheet from "./Sheet";

interface Props {
  open: boolean;
  category: Category;
  priorDate: string;
  priorItems: DiaryItem[];
  /** 지금 카드에 더 넣을 수 있는 최대 개수 */
  room: number;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}

export default function CarryForwardPicker({
  open,
  category,
  priorDate,
  priorItems,
  room,
  onClose,
  onConfirm,
}: Props) {
  const meta = CATEGORY_META[category];
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      // 기본값: room 범위 안에서 전부 선택된 상태로 시작(원하는 것만 해제하면 됨)
      setSelected(new Set(priorItems.slice(0, room).map((it) => it.id)));
    }
  }, [open, priorItems, room]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= room) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const confirm = () => {
    if (selected.size === 0) return;
    onConfirm([...selected]);
  };

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={`${meta.label} 지난 항목 불러오기`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} aria-hidden="true" />
          <h2 className="break-keep text-base font-bold">지난 항목 불러오기</h2>
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

      <p className="mb-2 break-keep text-xs text-neutral-400">
        {formatShortDate(priorDate)}의 {meta.label} 항목 중 가져올 것을 고르세요. ({selected.size}/{room})
      </p>

      <ul className="flex-1 space-y-0.5 overflow-y-auto">
        {priorItems.map((item) => {
          const checked = selected.has(item.id);
          const capped = !checked && selected.size >= room;
          return (
            <li key={item.id}>
              <label
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  capped
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={capped}
                  onChange={() => toggle(item.id)}
                  className="size-4 shrink-0 rounded border-neutral-300 dark:border-neutral-600"
                />
                <span className="flex-1 break-keep">{item.text}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          취소
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={selected.size === 0}
          className="flex-1 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          가져오기 ({selected.size})
        </button>
      </div>
    </Sheet>
  );
}
