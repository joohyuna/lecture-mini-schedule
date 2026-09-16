"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { MAX_TEXT_LENGTH, type DiaryItem } from "../lib/types";

interface Props {
  item: DiaryItem;
  isDont: boolean;
  readOnly: boolean;
  /** 이미 충분히 넓은 컨테이너(팝업 등)에서는 모바일에서도 한 줄로 표시 */
  wide?: boolean;
  /** 모바일에서는 아예 숨기고 md부터만 표시(카드 인라인 개수 제한용) */
  hiddenOnMobile?: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export default function ItemRow({
  item,
  isDont,
  readOnly,
  wide = false,
  hiddenOnMobile = false,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const done = item.status === "done";
  const broken = item.status === "broken";

  const commit = () => {
    const t = draft.trim();
    if (t && t !== item.text) onEdit(item.id, t);
    else setDraft(item.text);
    setEditing(false);
  };

  return (
    <li
      className={cn(
        "group gap-1 rounded-md px-2 py-1.5 text-sm",
        "hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
        hiddenOnMobile
          ? "hidden md:flex md:items-center md:gap-2"
          : wide
            ? "flex flex-row items-center gap-2"
            : "flex flex-col md:flex-row md:items-center md:gap-2"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          wide || hiddenOnMobile ? "min-w-0 flex-1" : "md:min-w-0 md:flex-1"
        )}
      >
        {/* 상태 토글 */}
        {isDont ? (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => onToggle(item.id)}
          aria-pressed={broken}
          aria-label={broken ? "어김 해제" : "오늘 어김으로 표시"}
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium transition",
            broken
              ? "border-rose-500 bg-rose-500 text-white"
              : "border-neutral-300 text-neutral-400 dark:border-neutral-600",
            !readOnly && "hover:border-rose-400",
            readOnly && "cursor-default opacity-70"
          )}
        >
          {broken ? "어김" : "지킴"}
        </button>
      ) : (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => onToggle(item.id)}
          role="checkbox"
          aria-checked={done}
          aria-label={done ? "완료 해제" : "완료로 표시"}
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border transition",
            done
              ? "border-neutral-400 bg-neutral-400 text-white dark:border-neutral-500 dark:bg-neutral-500"
              : "border-neutral-300 dark:border-neutral-600",
            !readOnly && "hover:border-emerald-400",
            readOnly && "cursor-default opacity-70"
          )}
        >
          {done && (
            <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
              <path
                d="M2.5 6.5l2.5 2.5 4.5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}

      {/* 내용 */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          maxLength={MAX_TEXT_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(item.text);
              setEditing(false);
            }
          }}
          className="flex-1 rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-sm outline-none focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-900"
        />
      ) : (
        <span
          onDoubleClick={() => !readOnly && setEditing(true)}
          className={cn(
            "flex-1 break-keep",
            done && "text-neutral-400 line-through dark:text-neutral-500",
            broken && "text-rose-600 dark:text-rose-400"
          )}
        >
          {item.text}
        </span>
      )}
      </div>

      {/* 액션 */}
      {!readOnly && !editing && (
        <span className="flex shrink-0 items-center justify-end gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="수정"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
              <path
                d="M11.5 2.5l2 2L6 12l-2.5.5L4 10l7.5-7.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label="삭제"
            className="rounded p-1 text-neutral-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
              <path
                d="M3 4.5h10M6.3 4.5V3.3a1 1 0 0 1 1-1h1.4a1 1 0 0 1 1 1v1.2M4.5 4.5l.6 8.2a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.7 7v4M9.3 7v4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </span>
      )}
    </li>
  );
}
