"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Send, PartyPopper, Lightbulb, RefreshCw, Loader2, Home } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MathText } from "@/components/math/MathText";
import { compareAnswer } from "@/lib/utils/compareAnswer";
import { celebrate } from "@/lib/utils/celebrate";
import { recordLearning } from "@/lib/learning/recordLearning";
import { useUser } from "@/components/providers/AuthProvider";
import { useChildStore } from "@/stores/childStore";
import type { Curriculum, SimilarQuestion } from "@/types/analyze";

function PracticeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const activeChildId = useChildStore((s) => s.activeChildId);
  const reduceMotion = useReducedMotion();
  const shake = useAnimationControls();
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef<number>(0);
  const savedRef = useRef<Set<string>>(new Set());

  const unit = params.get("unit") ?? "";
  const curriculum: Curriculum = {
    grade: params.get("grade") ?? "",
    semester: params.get("semester") ?? "",
    unit,
    concept: params.get("concept") ?? "",
  };

  const [current, setCurrent] = useState<SimilarQuestion | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState<"input" | "correct" | "incorrect">("input");
  const [loading, setLoading] = useState(Boolean(unit));
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curriculum, avoid: seen }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "문제를 만들지 못했어요.");
        return;
      }
      const next = data.similar_question as SimilarQuestion;
      setCurrent(next);
      setCurrentQuestionId((data.question_id as string | null) ?? null);
      setSeen((prev) => [next.question, ...prev].slice(0, 6));
      setValue("");
      setAttempts(0);
      setPhase("input");
      startedAtRef.current = Date.now();
    } catch {
      setError("문제를 만들지 못했어요. 다시 해볼까?");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  useEffect(() => {
    if (unit) void Promise.resolve().then(fetchOne);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === "input") inputRef.current?.focus();
  }, [current, phase]);

  const save = (q: SimilarQuestion, isCorrect: boolean, tries: number) => {
    if (!user || !activeChildId || savedRef.current.has(q.question)) return;
    savedRef.current.add(q.question);
    void recordLearning({
      childProfileId: activeChildId,
      curriculum,
      questionText: q.question,
      questionId: currentQuestionId,
      isCorrect,
      attempts: tries,
      timeSpentS: Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)),
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!current || phase === "correct" || value.trim() === "") return;
    if (compareAnswer(value, current.correct_answer)) {
      setPhase("correct");
      celebrate();
      save(current, true, attempts + 1);
    } else {
      setAttempts((p) => p + 1);
      setPhase("incorrect");
      if (!reduceMotion) {
        shake.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } });
      }
    }
  };

  const handleNext = () => {
    if (current && phase === "incorrect") save(current, false, attempts);
    void fetchOne();
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">단원 다시 도전</h1>
        <p className="mt-1 text-ink-soft">
          {curriculum.unit || "선택한 단원"} · 비슷한 문제로 연습해요.
        </p>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center gap-3 py-10 text-ink-soft">
          <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden="true" />
          스냅이가 문제 만드는 중…
        </Card>
      ) : error || !unit ? (
        <Card className="flex flex-col items-center gap-4 text-center">
          <p className="text-ink" role="alert">
            {error ?? "어떤 단원을 연습할지 알 수 없어요."}
          </p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => void fetchOne()}>
              <RefreshCw className="h-5 w-5" aria-hidden="true" /> 다시 시도
            </Button>
            <Button variant="ghost" onClick={() => router.push("/history")}>
              돌아가기
            </Button>
          </div>
        </Card>
      ) : current ? (
        <Card className="flex flex-col gap-5" as="section">
          <p
            className="rounded-card bg-brand-soft px-5 py-4 text-2xl font-semibold leading-relaxed text-ink"
            aria-label="연습 문제"
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
                <PartyPopper className="h-7 w-7 flex-none text-success" aria-hidden="true" />
                <p className="text-xl font-bold text-success">정답이야! 잘했어! 🎉</p>
              </motion.div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="accent" size="md" onClick={handleNext}>
                  <RefreshCw className="h-5 w-5" aria-hidden="true" /> 한 문제 더
                </Button>
                <Button variant="ghost" size="md" onClick={() => router.push("/history")}>
                  <Home className="h-5 w-5" aria-hidden="true" /> 학습 기록으로
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label htmlFor="practice-answer" className="sr-only">
                내 답 입력
              </label>
              <motion.input
                ref={inputRef}
                animate={shake}
                id="practice-answer"
                type="text"
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
              <Button variant="accent" size="md" onClick={handleNext}>
                <RefreshCw className="h-5 w-5" aria-hidden="true" /> 다른 문제로
              </Button>
            </motion.div>
          )}
        </Card>
      ) : null}
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="불러오는 중" />
        </main>
      }
    >
      <PracticeInner />
    </Suspense>
  );
}
