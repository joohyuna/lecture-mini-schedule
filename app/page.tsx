"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddItemModal from "./components/AddItemModal";
import Board from "./components/Board";
import DailyFeedback from "./components/DailyFeedback";
import DiaryDatePopup from "./components/DiaryDatePopup";
import Header from "./components/Header";
import { addDays, isFuture as isFutureDate, todayStr } from "./lib/date";
import { CATEGORIES, MAX_ITEMS_PER_CARD, type Category } from "./lib/types";
import { useDiary } from "./lib/useDiary";
import { useSwipe } from "./lib/useSwipe";
import { useTheme } from "./lib/useTheme";

export default function HomePage() {
  const diary = useDiary();
  const theme = useTheme();

  const [today, setToday] = useState(() => todayStr());
  const [selectedDate, setSelectedDate] = useState(() => todayStr());
  const [addOpen, setAddOpen] = useState(false);
  const [addCategory, setAddCategory] = useState<Category>("donow");
  const [dateOpen, setDateOpen] = useState(false);

  // 자정을 넘겨 날짜가 바뀌면 today 갱신 (재방문 / 포커스 / 1분 주기)
  useEffect(() => {
    const sync = () => setToday(todayStr());
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    const id = window.setInterval(sync, 60_000);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(id);
    };
  }, []);

  // 오늘을 보고 있었다면 새 오늘로 따라 이동
  const prevTodayRef = useRef(today);
  useEffect(() => {
    const prev = prevTodayRef.current;
    if (prev !== today) {
      setSelectedDate((sd) => (sd === prev ? today : sd));
      prevTodayRef.current = today;
    }
  }, [today]);

  // 과거 = 완전 읽기 전용, 미래 = 계획 모드(추가/수정/삭제는 되지만 완료 체크는 당일에만)
  const readOnly = selectedDate < today;
  const isFuture = isFutureDate(selectedDate);
  // 하루의 피드백(회고)은 실제 그날에만 쓸 수 있다 — 미래 날짜엔 회고할 게 없음
  const feedbackReadOnly = selectedDate !== today;

  /** delta 일만큼 날짜 이동 */
  const goRelative = useCallback((delta: number) => {
    setSelectedDate((cur) => addDays(cur, delta));
  }, []);

  // 좌우 방향키로 날짜 이동 (입력 중 / 팝업 열림 시 제외)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (addOpen || dateOpen) return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowLeft") goRelative(-1);
      else if (e.key === "ArrowRight") goRelative(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addOpen, dateOpen, goRelative]);

  // 가로 스와이프: 왼쪽 = 다음 날, 오른쪽 = 이전 날
  const swipe = useSwipe(
    () => goRelative(1),
    () => goRelative(-1),
    !addOpen && !dateOpen
  );

  const disabledCategories = useMemo(() => {
    if (readOnly) return [] as Category[];
    return CATEGORIES.filter(
      (c) => diary.countFor(selectedDate, c) >= MAX_ITEMS_PER_CARD
    );
  }, [diary, selectedDate, readOnly]);

  const openAdd = (category: Category) => {
    setAddCategory(category);
    setAddOpen(true);
  };

  const feedbackText = diary.feedback[selectedDate]?.text ?? "";

  if (!diary.ready) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 text-sm text-neutral-400">
        불러오는 중…
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-4xl px-4 py-6 pb-16 sm:px-6"
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      <Header
        selectedDate={selectedDate}
        readOnly={readOnly}
        isFuture={isFuture}
        themeMode={theme.mode}
        onPrevDay={() => goRelative(-1)}
        onNextDay={() => goRelative(1)}
        onOpenDatePopup={() => setDateOpen(true)}
        onCycleTheme={theme.cycle}
        onExport={diary.exportJSON}
        onImport={diary.importJSON}
      />

      <div key={selectedDate} className="day-enter space-y-4">
        <Board
          diary={diary}
          selectedDate={selectedDate}
          readOnly={readOnly}
          isFuture={isFuture}
          onAdd={openAdd}
        />

        <DailyFeedback
          value={feedbackText}
          readOnly={feedbackReadOnly}
          onSave={(text) => diary.setFeedback(selectedDate, text)}
        />
      </div>

      <AddItemModal
        open={addOpen}
        defaultCategory={addCategory}
        disabledCategories={disabledCategories}
        onClose={() => setAddOpen(false)}
        onSubmit={(category, text) => diary.addItem(selectedDate, category, text)}
      />

      <DiaryDatePopup
        open={dateOpen}
        selectedDate={selectedDate}
        dayMeta={diary.dayMeta}
        onClose={() => setDateOpen(false)}
        onPick={setSelectedDate}
      />
    </main>
  );
}
