import type { DayFeedback, DiaryItem, ThemeMode } from "./types";

const ITEMS_KEY = "mini-diary:v1:items";
const FEEDBACK_KEY = "mini-diary:v1:feedback";
const THEME_KEY = "mini-diary:v1:theme";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간 초과 등은 조용히 무시
  }
}

/* ---------- items ---------- */

export function loadItems(): DiaryItem[] {
  const data = read<DiaryItem[]>(ITEMS_KEY, []);
  return Array.isArray(data) ? data.filter(isValidItem) : [];
}

export function saveItems(items: DiaryItem[]): void {
  write(ITEMS_KEY, items);
}

/* ---------- feedback ---------- */

export function loadFeedback(): Record<string, DayFeedback> {
  const data = read<Record<string, DayFeedback>>(FEEDBACK_KEY, {});
  return data && typeof data === "object" ? data : {};
}

export function saveFeedback(map: Record<string, DayFeedback>): void {
  write(FEEDBACK_KEY, map);
}

/* ---------- theme ---------- */

export function loadTheme(): ThemeMode {
  const t = read<ThemeMode>(THEME_KEY, "system");
  return t === "light" || t === "dark" || t === "system" ? t : "system";
}

export function saveTheme(mode: ThemeMode): void {
  write(THEME_KEY, mode);
}

/* ---------- import / export ---------- */

export interface DiaryBackup {
  version: 1;
  exportedAt: string;
  items: DiaryItem[];
  feedback: Record<string, DayFeedback>;
}

export function buildBackup(
  items: DiaryItem[],
  feedback: Record<string, DayFeedback>
): DiaryBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
    feedback,
  };
}

export function parseBackup(text: string): DiaryBackup {
  const parsed = JSON.parse(text) as Partial<DiaryBackup>;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("올바른 백업 파일이 아닙니다.");
  }
  const items = Array.isArray(parsed.items)
    ? parsed.items.filter(isValidItem)
    : [];
  const feedback =
    parsed.feedback && typeof parsed.feedback === "object"
      ? (parsed.feedback as Record<string, DayFeedback>)
      : {};
  if (items.length === 0 && Object.keys(feedback).length === 0) {
    throw new Error("가져올 데이터가 없습니다.");
  }
  return { version: 1, exportedAt: new Date().toISOString(), items, feedback };
}

function isValidItem(v: unknown): v is DiaryItem {
  if (!v || typeof v !== "object") return false;
  const it = v as Record<string, unknown>;
  return (
    typeof it.id === "string" &&
    typeof it.date === "string" &&
    typeof it.category === "string" &&
    typeof it.text === "string" &&
    typeof it.status === "string"
  );
}
