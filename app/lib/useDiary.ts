"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildBackup,
  loadFeedback,
  loadItems,
  parseBackup,
  saveFeedback,
  saveItems,
} from "./storage";
import type { Category, DayFeedback, DayMeta, DiaryItem } from "./types";
import { MAX_ITEMS_PER_CARD, MAX_TEXT_LENGTH } from "./types";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useDiary() {
  const [items, setItems] = useState<DiaryItem[]>([]);
  const [feedback, setFeedbackMap] = useState<Record<string, DayFeedback>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(loadItems());
    setFeedbackMap(loadFeedback());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveItems(items);
  }, [items, ready]);

  useEffect(() => {
    if (ready) saveFeedback(feedback);
  }, [feedback, ready]);

  /** 특정 날짜 + 카테고리의 항목 (open 먼저, done/broken 나중, 각각 생성순) */
  const getItems = useCallback(
    (date: string, category: Category) =>
      items
        .filter((it) => it.date === date && it.category === category)
        .sort((a, b) => {
          const aDone = a.status !== "open" ? 1 : 0;
          const bDone = b.status !== "open" ? 1 : 0;
          if (aDone !== bDone) return aDone - bDone;
          return a.createdAt - b.createdAt;
        }),
    [items]
  );

  const countFor = useCallback(
    (date: string, category: Category) =>
      items.filter((it) => it.date === date && it.category === category).length,
    [items]
  );

  const addItem = useCallback(
    (date: string, category: Category, rawText: string) => {
      const text = rawText.trim().slice(0, MAX_TEXT_LENGTH);
      if (!text) return;
      setItems((prev) => {
        const count = prev.filter(
          (it) => it.date === date && it.category === category
        ).length;
        if (count >= MAX_ITEMS_PER_CARD) return prev;
        const now = Date.now();
        return [
          ...prev,
          {
            id: uid(),
            date,
            category,
            text,
            status: "open",
            createdAt: now,
            updatedAt: now,
          },
        ];
      });
    },
    []
  );

  const toggleStatus = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next =
          it.category === "dont"
            ? it.status === "broken"
              ? "open"
              : "broken"
            : it.status === "done"
              ? "open"
              : "done";
        return { ...it, status: next, updatedAt: Date.now() };
      })
    );
  }, []);

  const editItem = useCallback((id: string, rawText: string) => {
    const text = rawText.trim().slice(0, MAX_TEXT_LENGTH);
    if (!text) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, text, updatedAt: Date.now() } : it
      )
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  /** fromDate 의 category 항목들을 targetDate 로 복제 (내용만, 상태 초기화) */
  const carryForward = useCallback(
    (fromDate: string, targetDate: string, category: Category) => {
      setItems((prev) => {
        const source = prev.filter(
          (it) => it.date === fromDate && it.category === category
        );
        if (source.length === 0) return prev;
        const existing = prev.filter(
          (it) => it.date === targetDate && it.category === category
        ).length;
        const room = MAX_ITEMS_PER_CARD - existing;
        if (room <= 0) return prev;
        const now = Date.now();
        const clones: DiaryItem[] = source.slice(0, room).map((it, i) => ({
          id: uid(),
          date: targetDate,
          category,
          text: it.text,
          status: "open",
          createdAt: now + i,
          updatedAt: now + i,
        }));
        return [...prev, ...clones];
      });
    },
    []
  );

  /** category 에서 targetDate 이전, 항목이 있는 가장 최근 날짜 */
  const latestPriorDate = useCallback(
    (targetDate: string, category: Category): string | null => {
      const dates = items
        .filter((it) => it.category === category && it.date < targetDate)
        .map((it) => it.date);
      return dates.length ? dates.sort().at(-1)! : null;
    },
    [items]
  );

  const setFeedback = useCallback((date: string, text: string) => {
    setFeedbackMap((prev) => ({
      ...prev,
      [date]: { date, text, updatedAt: Date.now() },
    }));
  }, []);

  /** 날짜별 요약 (달력 표시용) */
  const dayMeta = useMemo(() => {
    const map: Record<string, DayMeta> = {};
    const ensure = (d: string) =>
      (map[d] ??= { total: 0, open: 0, broken: 0, feedback: false });
    for (const it of items) {
      const m = ensure(it.date);
      m.total++;
      if (it.status === "open") m.open++;
      else if (it.status === "broken") m.broken++;
    }
    for (const f of Object.values(feedback)) {
      if (f.text.trim()) ensure(f.date).feedback = true;
    }
    return map;
  }, [items, feedback]);

  const exportJSON = useCallback(
    () => JSON.stringify(buildBackup(items, feedback), null, 2),
    [items, feedback]
  );

  const importJSON = useCallback((text: string) => {
    const backup = parseBackup(text);
    setItems(backup.items);
    setFeedbackMap(backup.feedback);
  }, []);

  return {
    ready,
    items,
    feedback,
    dayMeta,
    getItems,
    countFor,
    addItem,
    toggleStatus,
    editItem,
    deleteItem,
    carryForward,
    latestPriorDate,
    setFeedback,
    exportJSON,
    importJSON,
  };
}

export type UseDiary = ReturnType<typeof useDiary>;
