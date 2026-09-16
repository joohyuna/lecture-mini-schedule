"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  /** 데스크탑에서의 정렬. DiaryDatePopup처럼 상단 쪽에 띄우고 싶으면 "start". */
  align?: "center" | "start";
  children: ReactNode;
}

/**
 * 모바일에서는 하단에서 슬라이드업하는 바텀시트로, md 이상에서는 기존처럼
 * 중앙(또는 align="start"면 상단)에 뜨는 모달로 보이는 공통 팝업 래퍼.
 * 배경 클릭 / Esc 로 닫히는 동작을 여기 한 곳에서 처리한다.
 */
export default function Sheet({ open, onClose, ariaLabel, align = "center", children }: Props) {
  // day-enter 등 transform 애니메이션이 걸린 조상 안에서 렌더링되면
  // position: fixed 가 뷰포트가 아니라 그 조상 기준으로 잡혀버리는
  // CSS 컨테이닝 블록 문제가 있어, body에 직접 포털로 렌더링한다.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:p-4",
        align === "start" ? "md:items-start md:pt-16" : "md:items-center"
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          "sheet-enter flex max-h-[85vh] w-full flex-col overflow-y-auto",
          "rounded-t-2xl border border-neutral-200 bg-white p-5 shadow-xl",
          "dark:border-neutral-800 dark:bg-neutral-900",
          "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          "md:max-w-sm md:rounded-2xl md:pb-5"
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
