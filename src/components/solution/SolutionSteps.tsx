"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, HelpCircle, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MathText } from "@/components/math/MathText";
import { useAnalyzeStore } from "@/stores/analyzeStore";

const STEP_INTERVAL_MS = 1500;

interface SolutionStepsProps {
  onAllRevealed?: () => void;
  mode?: "reveal" | "collapsible";
  expanded?: boolean;
  onToggle?: () => void;
}

export function SolutionSteps({
  onAllRevealed,
  mode = "reveal",
  expanded = false,
  onToggle,
}: SolutionStepsProps) {
  const { solveResult } = useAnalyzeStore();
  const reduceMotion = useReducedMotion();
  const steps = solveResult?.step_by_step_solution ?? [];
  const total = steps.length;

  const [revealed, setRevealed] = useState(0);
  const isReveal = mode === "reveal";
  const shown = !isReveal ? total : reduceMotion ? total : revealed;

  useEffect(() => {
    if (!isReveal || reduceMotion || total === 0 || revealed >= total) return;
    const timer = setInterval(() => {
      setRevealed((prev) => (prev >= total ? prev : prev + 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isReveal, total, reduceMotion, revealed]);

  useEffect(() => {
    if (!isReveal) return;
    if (total === 0 || shown >= total) onAllRevealed?.();
  }, [isReveal, shown, total, onAllRevealed]);

  if (!solveResult) return null;

  if (!solveResult.verified) {
    return (
      <Card className="flex flex-col items-center gap-4 text-center">
        <span className="text-5xl" role="img" aria-label="스냅이">
          🦊
        </span>
        <p className="text-xl font-semibold text-ink">
          이 문제는 내가 아직 자신이 없어.
        </p>
        <p className="flex items-center gap-2 text-base text-gentle">
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
          선생님이나 부모님께 같이 물어보자!
        </p>
      </Card>
    );
  }

  const { curriculum, final_answer } = solveResult;
  const allShown = shown >= total;

  const tags = (
    <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
      <span className="rounded-full bg-brand-soft px-3 py-1 font-medium text-brand">
        {curriculum.grade} {curriculum.semester}
      </span>
      <span className="rounded-full bg-brand-soft px-3 py-1 font-medium text-brand">
        {curriculum.unit}
      </span>
    </div>
  );

  const stepList = (
    <ol className="flex flex-col gap-3" aria-live="polite">
      {steps.slice(0, shown).map((step, i) => (
        <motion.li
          key={i}
          initial={isReveal && !reduceMotion ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex gap-3 rounded-card bg-surface-soft px-4 py-3"
        >
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            {i + 1}
          </span>
          <MathText className="text-lg leading-relaxed text-ink">
            {step}
          </MathText>
        </motion.li>
      ))}
    </ol>
  );

  const answerBox = (
    <div className="flex items-center gap-3 rounded-card bg-success/15 px-5 py-4">
      <Sparkles className="h-6 w-6 flex-none text-success" aria-hidden="true" />
      <p className="text-xl font-bold text-ink">
        정답: <MathText className="text-success">{final_answer}</MathText>
      </p>
    </div>
  );

  if (!isReveal) {
    return (
      <Card className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex items-center justify-between gap-3 text-left"
        >
          <span className="flex flex-col gap-2">
            <span className="text-base font-semibold text-ink">
              스냅이의 풀이
            </span>
            {tags}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-brand">
            {expanded ? "접기" : "풀이 펼쳐보기"}
            <ChevronDown
              className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </span>
        </button>

        {!expanded && (
          <p className="flex items-center gap-2 rounded-card bg-success/15 px-4 py-3 text-base font-bold text-ink">
            <Sparkles
              className="h-5 w-5 flex-none text-success"
              aria-hidden="true"
            />
            정답: <MathText className="text-success">{final_answer}</MathText>
          </p>
        )}

        {expanded && (
          <div className="flex flex-col gap-4">
            {stepList}
            {answerBox}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      {tags}
      <h2 className="text-lg font-semibold text-ink">스냅이의 풀이</h2>
      {stepList}
      {allShown && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {answerBox}
        </motion.div>
      )}
    </Card>
  );
}
