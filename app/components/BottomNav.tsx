"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/cn";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/stats", label: "통계", icon: "📊" },
  { href: "/account", label: "계정", icon: "👤" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex justify-center",
        "border-t border-neutral-200 bg-white/95 backdrop-blur",
        "dark:border-neutral-800 dark:bg-neutral-950/95",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex w-full max-w-4xl">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
                active
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-400 dark:text-neutral-500"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
