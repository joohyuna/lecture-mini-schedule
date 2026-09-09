"use client";

import { useRef } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * 가로 스와이프 감지. 손가락을 왼쪽으로 = onSwipeLeft(다음), 오른쪽으로 = onSwipeRight(이전).
 * 세로 스크롤과 겹치지 않도록 가로 이동이 세로 이동보다 충분히 클 때만 인식.
 */
export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  enabled = true
): SwipeHandlers {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  return {
    onTouchStart: (e) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    },
    onTouchEnd: (e) => {
      const s = start.current;
      start.current = null;
      if (!enabled || !s) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (Date.now() - s.t > 800) return;
      if (Math.abs(dx) < 60) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },
  };
}
