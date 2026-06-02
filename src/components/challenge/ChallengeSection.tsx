"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import {
  Send,
  PartyPopper,
  Lightbulb,
  RefreshCw,
  Camera,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MathText } from "@/components/math/MathText";
import { compareAnswer } from "@/lib/utils/compareAnswer";
import { celebrate } from "@/lib/utils/celebrate";
import { recordLearning } from "@/lib/learning/recordLearning";
import { useAnalyzeStore } from "@/stores/analyzeStore";
import { useChildStore } from "@/stores/childStore";
import { useUser } from "@/components/providers/AuthProvider";
import type { SimilarQuestion } from "@/types/analyze";

const REVIEW_AFTER_ATTEMPTS = 3;

interface ChallengeSectionProps {
  onReviewSolution: () => void;
  onRestart: () => void;
}

type Phase = "input" | "correct" | "incorrect";

export function ChallengeSection({
  onReviewSolution,
  onRestart,
}: ChallengeSectionProps) {
  const { solveResult, setChallengeStatus } = useAnalyzeStore();
  const { user } = useUser();
  const activeChildId = useChildStore((s) => s.activeChildId);
  const reduceMotion = useReducedMotion();
  const shake = useAnimationControls();
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef<number>(0);
  const savedRef = useRef<Set<string>>(new Set());

  const [current, setCurrent] = useState<SimilarQuestion | null>(
    solveResult?.similar_question ?? null,
  );
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    solveResult?.similar_question_id ?? null,
  );
  const [seen, setSeen] = useState<string[]>(
    solveResult?.similar_question ? [solveResult.similar_question.question] : [],
  );
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState<Phase>("input");
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase === "input") inputRef.current?.focus();
  }, [current, phase]);

  if (!current || !solveResult) return null;

  const save = (question: SimilarQuestion, isCorrect: boolean, tries: number) => {
    if (!user || !activeChildId) return;
    if (savedRef.current.has(question.question)) return;
    savedRef.current.add(question.question);
    void recordLearning({
      childProfileId: activeChildId,
      curriculum: solveResult.curriculum,
      questionText: question.question,
      questionId: currentQuestionId,
      isCorrect,
      attempts: tries,
      timeSpentS: Math.max(
        0,
        Math.round((Date.now() - startedAtRef.current) / 1000),
      ),
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (phase === "correct" || value.trim() === "") return;
    if (compareAnswer(value, current.correct_answer)) {
      setPhase("correct");
      setChallengeStatus("solved");
      celebrate();
      save(current, true, attempts + 1);
    } else {
      setAttempts((prev) => prev + 1);
      setPhase("incorrect");
      if (!reduceMotion) {
        shake.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } });
      }
    }
  };

  const fetchMore = async () => {
    if (loadingMore) return;
    if (phase === "incorrect") save(current, false, attempts);
    setLoadingMore(true);
    setMoreError(null);
    try {
      const res = await fetch("/api/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curriculum: solveResult.curriculum,
          avoid: seen,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMoreError(data.error ?? "새 문제를 만들지 못했어요.");
        return;
      }
      const next = data.similar_question as SimilarQuestion;
      setCurrent(next);
      setCurrentQuestionId((data.question_id as string | null) ?? null);
      setSeen((prev) => [next.question, ...prev].slice(0, 6));
      setValue("");
      setAttempts(0);
      setPhase("input");
      setChallengeStatus("active");
      startedAtRef.current = Date.now();
    } catch {
      setMoreError("새 문제를 만들지 못했어요. 다시 해볼까?");
    } finally {
      setLoadingMore(false);
    }
  };

  const moreButton = (
    <Button
      type="button"
      variant="accent"
      size="md"
      onClick={fetchMore}
      disabled={loadingMore}
    >
      {loadingMore ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="h-5 w-5" aria-hidden="true" />
      )}
      비슷한 문제 한 개 더
    </Button>
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="flex flex-col gap-5" as="section">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <span className="text-2xl" role="img" aria-label="스냅이">
              🦊
            </span>
            직접 풀어보기
          </h2>
          {phase !== "correct" && attempts > 0 && (
            <span className="text-sm text-ink-soft">{attempts}번째 도전 중</span>
          )}
        </div>

        <p
          className="rounded-card bg-brand-soft px-5 py-4 text-2xl font-semibold leading-relaxed text-ink"
          aria-label="도전 문제"
        >
          <MathText>{current.question}</MathText>
        </p>

        {phase === "correct" ? (
          <>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex items-center gap-3 rounded-card bg-success/15 px-5 py-4"
              role="status"
              aria-live="polite"
            >
              <PartyPopper
                className="h-7 w-7 flex-none text-success"
                aria-hidden="true"
              />
              <p className="text-xl font-bold text-success">
                정답이야! 정말 잘했어! 🎉
              </p>
            </motion.div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {moreButton}
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onRestart}
              >
                <Camera className="h-5 w-5" aria-hidden="true" /> 새 문제 풀기
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="challenge-answer" className="sr-only">
              내 답 입력
            </label>
            <motion.input
              ref={inputRef}
              animate={shake}
              id="challenge-answer"
              type="text"
              inputMode="text"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="여기에 답을 적어줘"
              className="min-h-14 rounded-card border-2 border-brand-soft bg-surface px-5 text-xl text-ink transition-colors focus:border-brand"
            />
            <Button type="submit" variant="primary" disabled={value.trim() === ""}>
              <Send className="h-5 w-5" aria-hidden="true" /> 정답 확인하기
            </Button>
          </form>
        )}

        {phase === "incorrect" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-3 rounded-card bg-gentle/15 px-5 py-4"
            role="status"
            aria-live="polite"
          >
            <p className="flex items-center gap-2 text-base font-semibold text-gentle">
              <Lightbulb className="h-5 w-5 flex-none" aria-hidden="true" />
              거의 다 왔어! 여기만 다시 볼까?
            </p>
            <p className="text-lg leading-relaxed text-ink">
              <MathText>{current.hint}</MathText>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {moreButton}
              {attempts >= REVIEW_AFTER_ATTEMPTS && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onReviewSolution}
                >
                  <BookOpen className="h-5 w-5" aria-hidden="true" /> 풀이 다시 보기
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {moreError && (
          <p className="text-sm text-gentle" role="alert">
            {moreError}
          </p>
        )}
      </Card>
    </motion.div>
  );
}
