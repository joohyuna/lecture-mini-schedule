"use client";

import { useCallback, useEffect, useState } from "react";
import { loadTheme, saveTheme } from "./storage";
import type { ThemeMode } from "./types";

const ORDER: ThemeMode[] = ["system", "light", "dark"];

function apply(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const initial = await loadTheme();
      if (cancelled) return;
      setMode(initial);
      apply(initial);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // system 모드일 때 OS 설정 변경 반영
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((prev) => {
      const next = ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length];
      void saveTheme(next);
      apply(next);
      return next;
    });
  }, []);

  return { mode, ready, cycle };
}
