"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Plus, ShieldCheck, Loader2, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/components/providers/AuthProvider";
import { useChildren } from "@/hooks/useChildren";

const GRADES = [4, 5, 6];
const SEMESTERS = [1, 2];

export default function ChildrenPage() {
  const router = useRouter();
  const { user, loading: authLoading, configured } = useUser();
  const {
    profiles,
    activeChildId,
    setActiveChild,
    loading,
    createProfile,
  } = useChildren();

  const [showForm, setShowForm] = useState(false);
  const [nickname, setNickname] = useState("");
  const [grade, setGrade] = useState(4);
  const [semester, setSemester] = useState(1);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (configured && !authLoading && !user) router.replace("/login");
  }, [configured, authLoading, user, router]);

  const formVisible = showForm || (!loading && profiles.length === 0);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (nickname.trim() === "") {
      setFormError("별명을 적어줘.");
      return;
    }
    if (!consent) {
      setFormError("학습 기록 저장에 동의해 주세요.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const created = await createProfile({ nickname, grade, semester, consent });
    setSaving(false);
    if (created) {
      setNickname("");
      setConsent(false);
      setShowForm(false);
    } else {
      setFormError("프로필을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  if (configured && (authLoading || loading)) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="불러오는 중" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">자녀 프로필</h1>
        <p className="mt-1 text-ink-soft">
          아이가 자기 프로필을 골라 학습해요. 별명과 학년만 있으면 돼요.
        </p>
      </div>

      {profiles.length > 0 && (
        <div className="flex flex-col gap-3">
          {profiles.map((p) => {
            const isActive = p.id === activeChildId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveChild(p.id)}
                aria-pressed={isActive}
                className={`flex items-center justify-between rounded-card border-2 px-5 py-4 text-left transition-colors ${
                  isActive
                    ? "border-brand bg-brand-soft"
                    : "border-brand-soft bg-surface-soft hover:border-brand"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                    {p.nickname[0]}
                  </span>
                  <span>
                    <span className="block text-lg font-semibold text-ink">
                      {p.nickname}
                    </span>
                    <span className="block text-sm text-ink-soft">
                      {p.grade}학년 {p.semester}학기
                    </span>
                  </span>
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-brand">
                    <Check className="h-5 w-5" aria-hidden="true" /> 학습 중
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!formVisible && (
        <Button
          variant="ghost"
          className="self-start"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-5 w-5" aria-hidden="true" /> 자녀 추가
        </Button>
      )}

      {formVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card as="section" className="flex flex-col gap-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <UserPlus className="h-6 w-6 text-brand" aria-hidden="true" />
              새 자녀 프로필
            </h2>

            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              <label className="flex flex-col gap-1 text-sm font-semibold text-ink-soft">
                별명
                <input
                  type="text"
                  value={nickname}
                  maxLength={20}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예: 별이, 호빵이"
                  className="min-h-12 rounded-card border-2 border-brand-soft bg-surface px-4 text-base text-ink focus:border-brand"
                />
                <span className="text-xs text-ink-soft">
                  실명 대신 별명을 권장해요.
                </span>
              </label>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-semibold text-ink-soft">학년</legend>
                <div className="flex gap-2">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      aria-pressed={grade === g}
                      className={`min-h-12 flex-1 rounded-card border-2 font-semibold transition-colors ${
                        grade === g
                          ? "border-brand bg-brand text-white"
                          : "border-brand-soft text-ink"
                      }`}
                    >
                      {g}학년
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-semibold text-ink-soft">학기</legend>
                <div className="flex gap-2">
                  {SEMESTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSemester(s)}
                      aria-pressed={semester === s}
                      className={`min-h-12 flex-1 rounded-card border-2 font-semibold transition-colors ${
                        semester === s
                          ? "border-brand bg-brand text-white"
                          : "border-brand-soft text-ink"
                      }`}
                    >
                      {s}학기
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col gap-3 rounded-card bg-brand-soft/60 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" />
                  무엇을, 왜, 언제까지 저장하나요?
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
                  <li>저장: 푼 문제의 단원·정답 여부·시도 횟수·걸린 시간</li>
                  <li>저장하지 않음: 사진 원본, 실명·학교·연락처</li>
                  <li>목적: 부모님이 학습 진척과 오답을 확인하기 위해서예요</li>
                  <li>삭제: 프로필을 지우면 그 학습 기록도 함께 사라져요</li>
                </ul>
                <label className="flex items-start gap-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-5 w-5 flex-none accent-brand"
                  />
                  <span>
                    법정대리인(부모)으로서 위 내용에 동의하고, 자녀의 학습 기록
                    저장에 동의합니다.
                  </span>
                </label>
              </div>

              {formError && (
                <p className="text-sm text-gentle" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving && (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  )}
                  프로필 만들기
                </Button>
                {profiles.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                  >
                    취소
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      <Button variant="ghost" className="self-start" onClick={() => router.push("/")}>
        문제 풀러 가기
      </Button>
    </main>
  );
}
