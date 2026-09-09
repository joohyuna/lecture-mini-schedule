"use client";

import { useEffect, useRef, useState } from "react";
import { todayStr } from "../lib/date";

interface Props {
  onExport: () => string;
  onImport: (text: string) => void;
}

export default function SettingsMenu({ onExport, onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const handleExport = () => {
    const json = onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mini-diary-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      if (
        !window.confirm(
          "가져오면 현재 데이터를 덮어씁니다. 계속할까요?"
        )
      ) {
        return;
      }
      onImport(text);
      setMsg("가져오기 완료");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "가져오기에 실패했습니다.");
    } finally {
      setOpen(false);
      window.setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="설정"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-base hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <span aria-hidden="true">⚙️</span>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <button
            type="button"
            onClick={handleExport}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            JSON 내보내기
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            JSON 가져오기
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
          e.target.value = "";
        }}
      />

      {msg && (
        <p className="absolute right-0 top-11 z-40 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs text-white dark:bg-neutral-100 dark:text-neutral-900">
          {msg}
        </p>
      )}
    </div>
  );
}
