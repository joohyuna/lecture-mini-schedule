"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDiary, type UseDiary } from "./useDiary";

const DiaryContext = createContext<UseDiary | null>(null);

/** useDiary()를 한 번만 호출해 탭(홈/통계/계정) 사이에서 같은 상태를 공유한다. */
export function DiaryProvider({ children }: { children: ReactNode }) {
  const diary = useDiary();
  return <DiaryContext.Provider value={diary}>{children}</DiaryContext.Provider>;
}

export function useDiaryContext(): UseDiary {
  const ctx = useContext(DiaryContext);
  if (!ctx) {
    throw new Error("useDiaryContext는 DiaryProvider 안에서만 쓸 수 있습니다.");
  }
  return ctx;
}
