export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 로컬 기준 오늘 날짜를 "YYYY-MM-DD" 로 반환 */
export function todayStr(base: Date = new Date()): string {
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" -> "2026년 9월 9일 (화)" */
export function formatKoreanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${wd})`;
}

/** "YYYY-MM-DD" -> "9/9 (화)" 짧은 표기 */
export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m}/${d} (${wd})`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

/** "YYYY-MM-DD" 에 delta 일을 더한 날짜 문자열 */
export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return todayStr(new Date(y, m - 1, d + delta));
}

export function isFuture(dateStr: string): boolean {
  return dateStr > todayStr();
}

/** year, month(1-12) -> "2026년 9월" */
export function monthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

/** 한 달 달력 격자 (6주 × 7일 = 42칸). 앞뒤로 이웃 달 날짜가 채워진다. */
export function monthMatrix(
  year: number,
  month: number
): { date: string; inMonth: boolean }[] {
  const first = new Date(year, month - 1, 1);
  const startDay = first.getDay(); // 0 = 일요일
  const cells: { date: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month - 1, 1 - startDay + i);
    cells.push({ date: todayStr(d), inMonth: d.getMonth() === month - 1 });
  }
  return cells;
}
