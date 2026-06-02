"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, Repeat, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/components/providers/AuthProvider";
import { useChildrenContext } from "@/components/providers/ChildrenProvider";

export function LearnerBanner() {
  const { user, configured } = useUser();
  const { profiles, activeChild, loading, openSwitcher } = useChildrenContext();

  if (!configured) return null;

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-md flex-col items-center gap-3 rounded-card border border-brand-soft bg-brand-soft/50 p-5 text-center"
      >
        <Sparkles className="h-7 w-7 text-brand" aria-hidden="true" />
        <p className="text-ink">
          회원가입하면 스냅이와 공부한 기록이 차곡차곡 쌓여요.
        </p>
        <Link href="/login?mode=signup&next=/" className="w-full sm:w-auto">
          <Button variant="primary" size="md" className="w-full">
            <LogIn className="h-5 w-5" aria-hidden="true" /> 회원가입하고 시작하기
          </Button>
        </Link>
      </motion.div>
    );
  }

  if (loading) return null;

  if (profiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-md flex-col items-center gap-3 rounded-card border border-brand-soft bg-brand-soft/50 p-5 text-center"
      >
        <Sparkles className="h-7 w-7 text-brand" aria-hidden="true" />
        <p className="text-ink">
          자녀를 등록하면 푼 문제와 오답을 기록으로 남길 수 있어요.
        </p>
        <Link href="/children" className="w-full sm:w-auto">
          <Button variant="primary" size="md" className="w-full">
            <UserPlus className="h-5 w-5" aria-hidden="true" /> 자녀 등록하기
          </Button>
        </Link>
      </motion.div>
    );
  }

  const multiple = profiles.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full max-w-md items-center justify-between gap-3 rounded-card border border-brand-soft bg-surface-soft px-4 py-3"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
          {activeChild?.nickname[0]}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-xs text-ink-soft">지금 학습하는 친구</span>
          <span className="text-lg font-bold text-ink">
            {activeChild?.nickname}
          </span>
        </span>
      </span>
      {multiple && (
        <Button type="button" variant="ghost" size="md" onClick={openSwitcher}>
          <Repeat className="h-5 w-5" aria-hidden="true" /> 바꾸기
        </Button>
      )}
    </motion.div>
  );
}
