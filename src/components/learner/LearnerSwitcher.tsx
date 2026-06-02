"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Plus, Settings2, X } from "lucide-react";
import { useChildrenContext } from "@/components/providers/ChildrenProvider";

export function LearnerSwitcher() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const {
    profiles,
    activeChildId,
    setActiveChild,
    switcherOpen,
    closeSwitcher,
  } = useChildrenContext();

  useEffect(() => {
    if (!switcherOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSwitcher();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [switcherOpen, closeSwitcher]);

  const goTo = (path: string) => {
    closeSwitcher();
    router.push(path);
  };

  return (
    <AnimatePresence>
      {switcherOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSwitcher}
          role="dialog"
          aria-modal="true"
          aria-label="학습자 선택"
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl border border-brand-soft bg-surface p-6 sm:rounded-card"
            initial={reduceMotion ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <span className="text-2xl" role="img" aria-label="스냅이">
                  🦊
                </span>
                누가 풀어볼까?
              </h2>
              <button
                type="button"
                onClick={closeSwitcher}
                aria-label="닫기"
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-brand-soft"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {profiles.map((p) => {
                const isActive = p.id === activeChildId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setActiveChild(p.id);
                      closeSwitcher();
                    }}
                    className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-card border-2 p-4 transition-colors ${
                      isActive
                        ? "border-brand bg-brand-soft"
                        : "border-brand-soft bg-surface-soft hover:border-brand"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
                      {p.nickname[0]}
                    </span>
                    <span className="text-center">
                      <span className="block font-semibold text-ink">
                        {p.nickname}
                      </span>
                      <span className="block text-xs text-ink-soft">
                        {p.grade}학년 {p.semester}학기
                      </span>
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => goTo("/children")}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-brand-soft text-brand transition-colors hover:bg-brand-soft"
              >
                <Plus className="h-8 w-8" aria-hidden="true" />
                <span className="font-semibold">자녀 추가</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => goTo("/children")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-card py-3 font-semibold text-ink-soft transition-colors hover:bg-brand-soft"
            >
              <Settings2 className="h-5 w-5" aria-hidden="true" /> 자녀 프로필 관리
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
