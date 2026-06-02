"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Target,
  CalendarDays,
  CheckCircle2,
  NotebookPen,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/components/providers/AuthProvider";
import { useChildren } from "@/hooks/useChildren";
import { useLearningHistory } from "@/hooks/useLearningHistory";

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading, configured } = useUser();
  const { profiles, activeChild, activeChildId, setActiveChild, loading } =
    useChildren();
  const { rows, summary, loading: historyLoading } =
    useLearningHistory(activeChildId);

  useEffect(() => {
    if (configured && !authLoading && !user) router.replace("/login");
  }, [configured, authLoading, user, router]);

  if (configured && (authLoading || loading)) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="불러오는 중" />
      </main>
    );
  }

  if (profiles.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <Card className="flex flex-col items-center gap-4 text-center text-ink-soft">
          <p>아직 자녀 프로필이 없어요. 먼저 프로필을 만들어 주세요.</p>
          <Button variant="primary" onClick={() => router.push("/children")}>
            자녀 프로필 만들기
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">학습 기록</h1>
        <p className="mt-1 text-ink-soft">
          {activeChild?.nickname}의 학습 진척과 오답을 확인해요.
        </p>
      </div>

      {profiles.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto"
          role="tablist"
          aria-label="자녀 선택"
        >
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === activeChildId}
              onClick={() => setActiveChild(p.id)}
              className={`min-h-11 flex-none rounded-card border-2 px-4 font-semibold transition-colors ${
                p.id === activeChildId
                  ? "border-brand bg-brand text-white"
                  : "border-brand-soft text-ink"
              }`}
            >
              {p.nickname}
            </button>
          ))}
        </div>
      )}

      {historyLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-brand" aria-label="불러오는 중" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 text-center text-ink-soft">
          <p>아직 푼 문제가 없어요. 문제를 풀면 여기에 기록이 쌓여요.</p>
          <Button variant="primary" onClick={() => router.push("/")}>
            문제 풀러 가기
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />}
              label="정답률"
              value={`${summary.correctRate}%`}
            />
            <StatCard
              icon={<Target className="h-6 w-6 text-brand" aria-hidden="true" />}
              label="푼 문제"
              value={`${summary.total}개`}
            />
            <StatCard
              icon={<CalendarDays className="h-6 w-6 text-gentle" aria-hidden="true" />}
              label="학습한 날"
              value={`${summary.activeDays}일`}
            />
          </div>

          <Card as="section" className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <NotebookPen className="h-6 w-6 text-gentle" aria-hidden="true" />
              오답 노트
            </h2>
            {summary.wrongUnits.length === 0 ? (
              <p className="text-ink-soft">
                틀린 문제가 없어요. 정말 잘하고 있어요! 🎉
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {summary.wrongUnits.map((u) => (
                  <li
                    key={u.unit}
                    className="flex items-center justify-between gap-3 rounded-card bg-gentle/10 px-4 py-3"
                  >
                    <span>
                      <span className="block font-semibold text-ink">{u.unit}</span>
                      <span className="block text-sm text-ink-soft">
                        {u.total}문제 중 {u.wrong}개 틀림
                      </span>
                    </span>
                    <Link
                      href={`/practice?grade=${activeChild?.grade ?? ""}&semester=${activeChild?.semester ?? ""}&unit=${encodeURIComponent(u.unit)}`}
                      className="inline-flex min-h-11 flex-none items-center gap-1 rounded-card bg-brand px-4 font-semibold text-white"
                    >
                      다시 도전 <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card as="section" className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-ink">최근 학습</h2>
            <ul className="flex flex-col divide-y divide-brand-soft">
              {rows.slice(0, 12).map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <span
                    className={`h-2.5 w-2.5 flex-none rounded-full ${
                      r.is_correct ? "bg-success" : "bg-gentle"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ink">
                      {r.question_text ?? r.unit ?? "문제"}
                    </span>
                    <span className="block text-xs text-ink-soft">
                      {r.unit ?? "기타"} · {r.created_at.slice(0, 10)} ·{" "}
                      {r.is_correct ? "정답" : "오답"}
                      {r.attempts ? ` · ${r.attempts}회 시도` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-card border border-brand-soft bg-surface-soft px-3 py-4 text-center">
      {icon}
      <span className="text-xl font-bold text-ink">{value}</span>
      <span className="text-xs text-ink-soft">{label}</span>
    </div>
  );
}
