export type Category = "longterm" | "donow" | "dont" | "extra";

// longterm / donow / extra : "open" <-> "done"
// dont                     : "open"(지킴) <-> "broken"(어김)
export type ItemStatus = "open" | "done" | "broken";

export interface DiaryItem {
  id: string;
  date: string; // "YYYY-MM-DD"
  category: Category;
  text: string;
  status: ItemStatus;
  createdAt: number;
  updatedAt: number;
}

export interface DayFeedback {
  date: string; // "YYYY-MM-DD"
  text: string;
  updatedAt: number;
}

/** 달력 표시용 하루 요약 */
export interface DayMeta {
  total: number;
  open: number;
  broken: number;
  feedback: boolean;
}

export type ThemeMode = "light" | "dark" | "system";

export const CATEGORIES: Category[] = ["longterm", "donow", "dont", "extra"];

export const MAX_ITEMS_PER_CARD = 10;
export const MAX_TEXT_LENGTH = 80;

interface CategoryMeta {
  label: string;
  sub: string;
  /** 하지 말아야 할 일 계열이면 true (상태 토글이 "어김") */
  isDont: boolean;
  /** 카테고리 포인트 색 (Tailwind 색상 이름) */
  dot: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  longterm: {
    label: "Longterm",
    sub: "장기 목표",
    isDont: false,
    dot: "bg-sky-500",
  },
  donow: {
    label: "Do Now",
    sub: "오늘 집중할 일",
    isDont: false,
    dot: "bg-emerald-500",
  },
  dont: {
    label: "Don't",
    sub: "하지 말 일",
    isDont: true,
    dot: "bg-rose-500",
  },
  extra: {
    label: "Extra",
    sub: "기타 · 갑자기 생긴 일",
    isDont: false,
    dot: "bg-amber-500",
  },
};

/** carry-forward(지난 항목 불러오기)를 지원하는 카테고리 */
export const CARRYABLE: Category[] = ["longterm", "dont"];
