"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore, type ThemePreference } from "@/stores/themeStore";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "밝게", Icon: Sun },
  { value: "dark", label: "어둡게", Icon: Moon },
  { value: "system", label: "시스템", Icon: Monitor },
];

export function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <div
      role="group"
      aria-label="화면 밝기 설정"
      className="inline-flex gap-1 rounded-card border border-brand-soft bg-surface-soft p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-pressed={active}
            title={label}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              active ? "bg-brand text-white" : "text-ink-soft hover:text-brand"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
