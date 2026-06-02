"use client";

import Link from "next/link";
import { ChevronDown, UserPlus } from "lucide-react";
import { useUser } from "@/components/providers/AuthProvider";
import { useChildrenContext } from "@/components/providers/ChildrenProvider";

export function LearnerChip() {
  const { user, configured } = useUser();
  const { profiles, activeChild, openSwitcher } = useChildrenContext();

  if (!configured || !user) return null;

  if (profiles.length === 0) {
    return (
      <Link
        href="/children"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-dashed border-brand bg-brand-soft px-3 font-semibold text-brand transition-colors hover:bg-brand/10"
      >
        <UserPlus className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">자녀 등록</span>
      </Link>
    );
  }

  const multiple = profiles.length > 1;

  return (
    <button
      type="button"
      onClick={openSwitcher}
      aria-label={`지금 학습 중: ${activeChild?.nickname ?? ""}. 학습자 바꾸기`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-brand-soft bg-surface-soft px-2 pr-3 transition-colors hover:border-brand"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
        {activeChild?.nickname[0]}
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] text-ink-soft">학습 중</span>
        <span className="max-w-24 truncate text-sm font-semibold text-ink">
          {activeChild?.nickname}
        </span>
      </span>
      {multiple && (
        <ChevronDown className="h-4 w-4 text-ink-soft" aria-hidden="true" />
      )}
    </button>
  );
}
