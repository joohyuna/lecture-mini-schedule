"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import {
  CATEGORIES,
  CATEGORY_META,
  MAX_TEXT_LENGTH,
  type Category,
} from "../lib/types";
import Sheet from "./Sheet";

interface Props {
  open: boolean;
  defaultCategory: Category;
  disabledCategories: Category[];
  onClose: () => void;
  onSubmit: (category: Category, text: string) => void;
}

export default function AddItemModal({
  open,
  defaultCategory,
  disabledCategories,
  onClose,
  onSubmit,
}: Props) {
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setText("");
    }
  }, [open, defaultCategory]);

  const disabled = disabledCategories.includes(category);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSubmit(category, text);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="새 항목">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">새 항목</h2>
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

      <form onSubmit={submit} className="space-y-4">
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
              카테고리
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((c) => {
                const isDisabled = disabledCategories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    disabled={isDisabled}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition",
                      category === c
                        ? "border-neutral-800 bg-neutral-800 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                        : "border-neutral-200 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
                      isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn("size-2 rounded-full", CATEGORY_META[c].dot)}
                        aria-hidden="true"
                      />
                      {CATEGORY_META[c].label}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px]",
                        category === c
                          ? "text-neutral-300 dark:text-neutral-600"
                          : "text-neutral-400"
                      )}
                    >
                      {CATEGORY_META[c].sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
              내용
            </span>
            <input
              autoFocus
              value={text}
              maxLength={MAX_TEXT_LENGTH}
              onChange={(e) => setText(e.target.value)}
              placeholder="무엇을 적을까요?"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-900"
            />
            <span className="mt-1 block text-right text-[11px] text-neutral-400">
              {text.length}/{MAX_TEXT_LENGTH}
            </span>
          </label>

          {disabled && (
            <p className="text-xs text-rose-500">
              이 카테고리는 오늘 10개가 다 찼어요.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!text.trim() || disabled}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              저장
            </button>
          </div>
      </form>
    </Sheet>
  );
}
