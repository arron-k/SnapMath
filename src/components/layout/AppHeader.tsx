"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  LogIn,
  LogOut,
  Users,
  LineChart,
  Library,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useUser } from "@/components/providers/AuthProvider";
import { LearnerChip } from "@/components/learner/LearnerChip";

export function AppHeader() {
  const { user, configured, signOut } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const initial = user?.email?.[0]?.toUpperCase() ?? "👤";

  return (
    <header className="sticky top-0 z-20 border-b border-brand-soft bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-ink"
        >
          <span className="text-2xl" role="img" aria-label="스냅이">
            🦊
          </span>
          SnapMath
        </Link>

        <div className="flex items-center gap-2">
          <LearnerChip />
          <ThemeToggle />

          {configured && !user && (
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-card border-2 border-brand-soft px-4 font-semibold text-brand transition-colors hover:bg-brand-soft"
            >
              <LogIn className="h-5 w-5" aria-hidden="true" /> 부모 로그인
            </Link>
          )}

          {configured && user && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="inline-flex min-h-11 items-center gap-1 rounded-card border-2 border-brand-soft px-2 pr-3 font-semibold text-ink transition-colors hover:bg-brand-soft"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {initial}
                </span>
                <ChevronDown className="h-4 w-4 text-ink-soft" aria-hidden="true" />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 overflow-hidden rounded-card border border-brand-soft bg-surface shadow-lg"
                  >
                    <p className="truncate border-b border-brand-soft px-4 py-3 text-sm text-ink-soft">
                      {user.email}
                    </p>
                    <Link
                      href="/children"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-ink transition-colors hover:bg-brand-soft"
                    >
                      <Users className="h-5 w-5" aria-hidden="true" /> 자녀 관리
                    </Link>
                    <Link
                      href="/history"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-ink transition-colors hover:bg-brand-soft"
                    >
                      <LineChart className="h-5 w-5" aria-hidden="true" /> 학습 기록
                    </Link>
                    <Link
                      href="/admin/questions"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-ink transition-colors hover:bg-brand-soft"
                    >
                      <Library className="h-5 w-5" aria-hidden="true" /> 문항 풀 관리
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpen(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-2 border-t border-brand-soft px-4 py-3 text-ink transition-colors hover:bg-brand-soft"
                    >
                      <LogOut className="h-5 w-5" aria-hidden="true" /> 로그아웃
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
