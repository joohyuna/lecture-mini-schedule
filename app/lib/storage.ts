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

/* ---------- items ----------
 * async: 나중에 이 구현을 API 호출(예: MongoDB 연동)로 바꿔도
 * 호출부(useDiary.ts)는 그대로 두기 위한 의도적 설계. 지금은
 * localStorage를 그대로 쓰되 Promise로만 감싼다. */

export async function loadItems(): Promise<DiaryItem[]> {
  const data = read<DiaryItem[]>(ITEMS_KEY, []);
  return Array.isArray(data) ? data.filter(isValidItem) : [];
}

export async function saveItems(items: DiaryItem[]): Promise<void> {
  write(ITEMS_KEY, items);
}

/* ---------- feedback ---------- */

export async function loadFeedback(): Promise<Record<string, DayFeedback>> {
  const data = read<Record<string, DayFeedback>>(FEEDBACK_KEY, {});
  return data && typeof data === "object" ? data : {};
}

export async function saveFeedback(
  map: Record<string, DayFeedback>
): Promise<void> {
  write(FEEDBACK_KEY, map);
}

/* ---------- theme ---------- */

export async function loadTheme(): Promise<ThemeMode> {
  const t = read<ThemeMode>(THEME_KEY, "system");
  return t === "light" || t === "dark" || t === "system" ? t : "system";
}

export async function saveTheme(mode: ThemeMode): Promise<void> {
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
