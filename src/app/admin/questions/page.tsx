"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MathText } from "@/components/math/MathText";
import { useUser } from "@/components/providers/AuthProvider";
import type { PoolQuestion, ReviewStatus } from "@/lib/questionPool/types";

const STATUS_TABS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "auto", label: "자동" },
  { key: "approved", label: "승인" },
  { key: "flagged", label: "격리" },
];

const STATUS_BADGE: Record<ReviewStatus, string> = {
  auto: "bg-brand-soft text-brand",
  approved: "bg-success/20 text-success",
  flagged: "bg-gentle/20 text-gentle",
};

const STATUS_LABEL: Record<ReviewStatus, string> = {
  auto: "자동 적립",
  approved: "승인됨",
  flagged: "격리됨",
};

export default function AdminQuestionsPage() {
  const router = useRouter();
  const { user, loading: authLoading, configured } = useUser();

  const [tab, setTab] = useState<ReviewStatus | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<PoolQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (configured && !authLoading && !user) router.replace("/login");
  }, [configured, authLoading, user, router]);

  const fetchQuestions = useCallback(async () => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab);
    if (search) params.set("q", search);
    try {
      const res = await fetch(`/api/questions?${params.toString()}`);
      if (!res.ok) {
        setQuestions([]);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { questions: PoolQuestion[] };
      setQuestions(data.questions ?? []);
    } catch {
      setQuestions([]);
    }
    setLoading(false);
  }, [tab, search]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setLoading(true);
      return fetchQuestions();
    });
  }, [fetchQuestions]);

  const updateStatus = async (id: string, review_status: ReviewStatus) => {
    setBusyId(id);
    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, review_status }),
      });
      await fetchQuestions();
    } finally {
      setBusyId(null);
    }
  };

  if (configured && !authLoading && !user) return null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">문항 풀 관리</h1>
        <p className="text-sm text-ink-soft">
          검산을 통과해 적립된 문항을 살펴보고, 오류·부적절 문항을 격리할 수 있어요.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`min-h-11 rounded-card px-4 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-brand text-white"
                : "bg-surface-soft text-ink-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="문제 내용으로 검색"
          aria-label="문제 검색"
          className="min-h-12 flex-1 rounded-card border-2 border-brand-soft bg-surface px-4 text-ink focus:border-brand focus:outline-none"
        />
        <Button type="submit" variant="ghost" size="md">
          <Search className="h-5 w-5" aria-hidden="true" /> 검색
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-soft">
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="text-center text-ink-soft">
          아직 조건에 맞는 문항이 없어요.
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {questions.map((q) => {
            const status = q.review_status as ReviewStatus;
            return (
              <li key={q.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-1 font-semibold ${STATUS_BADGE[status]}`}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                    <span className="rounded-full bg-surface-soft px-2 py-1 text-ink-soft">
                      {q.source === "uploaded" ? "업로드" : "생성"}
                    </span>
                    {q.unit && (
                      <span className="rounded-full bg-surface-soft px-2 py-1 text-ink-soft">
                        {q.grade ? `${q.grade}학년 · ` : ""}
                        {q.unit}
                      </span>
                    )}
                    <span className="ml-auto text-ink-soft">
                      재사용 {q.usage_count}회
                    </span>
                  </div>

                  <div className="text-lg text-ink">
                    <MathText>{q.question_text}</MathText>
                  </div>
                  {q.final_answer && (
                    <p className="text-sm text-ink-soft">
                      정답: <span className="font-semibold text-ink">{q.final_answer}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {status !== "approved" && (
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        disabled={busyId === q.id}
                        onClick={() => updateStatus(q.id, "approved")}
                      >
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> 승인
                      </Button>
                    )}
                    {status !== "flagged" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        disabled={busyId === q.id}
                        onClick={() => updateStatus(q.id, "flagged")}
                      >
                        <ShieldAlert className="h-5 w-5" aria-hidden="true" /> 격리
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        disabled={busyId === q.id}
                        onClick={() => updateStatus(q.id, "auto")}
                      >
                        <RotateCcw className="h-5 w-5" aria-hidden="true" /> 격리 해제
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
