import type { DayFeedback, DiaryItem, ThemeMode } from "./types";

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

/* ---------- items / feedback ----------
 * MongoDB(Atlas) API 라우트를 호출한다. "전체 로드 / 전체 교체" 시맨틱은
 * localStorage 시절과 동일하게 유지 — useDiary.ts는 이 함수들의 시그니처만
 * 알면 되므로 변경 없음. 실패 시 콘솔 로그 + 커스텀 이벤트를 던지고 throw한다
 * (호출부는 대부분 fire-and-forget이라, SettingsMenu가 이 이벤트를 듣고 토스트로 알린다). */

function reportSyncError(scope: "items" | "feedback"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("mini-diary:sync-error", { detail: { scope } })
  );
}

export async function loadItems(): Promise<DiaryItem[]> {
  const res = await fetch("/api/diary/items", { cache: "no-store" });
  if (!res.ok) {
    console.error("loadItems failed", res.status);
    reportSyncError("items");
    throw new Error("ITEMS_LOAD_FAILED");
  }
  const data = (await res.json()) as { items: DiaryItem[] };
  return Array.isArray(data.items) ? data.items.filter(isValidItem) : [];
}

export async function saveItems(items: DiaryItem[]): Promise<void> {
  const res = await fetch("/api/diary/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    console.error("saveItems failed", res.status);
    reportSyncError("items");
    throw new Error("ITEMS_SAVE_FAILED");
  }
}

export async function loadFeedback(): Promise<Record<string, DayFeedback>> {
  const res = await fetch("/api/diary/feedback", { cache: "no-store" });
  if (!res.ok) {
    console.error("loadFeedback failed", res.status);
    reportSyncError("feedback");
    throw new Error("FEEDBACK_LOAD_FAILED");
  }
  const data = (await res.json()) as { feedback: Record<string, DayFeedback> };
  return data.feedback && typeof data.feedback === "object" ? data.feedback : {};
}

export async function saveFeedback(
  map: Record<string, DayFeedback>
): Promise<void> {
  const res = await fetch("/api/diary/feedback", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback: map }),
  });
  if (!res.ok) {
    console.error("saveFeedback failed", res.status);
    reportSyncError("feedback");
    throw new Error("FEEDBACK_SAVE_FAILED");
  }
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
