"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/AuthProvider";

type Mode = "login" | "signup";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/children";
  const initialMode: Mode = params.get("mode") === "signup" ? "signup" : "login";
  const { user, configured } = useUser();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, router, next]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMessage(
          "가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.",
        );
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        router.replace(next);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? friendlyAuthError(err.message)
          : "잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
        <Card className="text-center text-ink-soft">
          로그인 기능을 쓰려면 Supabase 설정이 필요해요. 지금은 로그인 없이도
          문제를 풀 수 있어요.
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ink">
              {mode === "login" ? "부모 로그인" : "부모 회원가입"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              자녀의 학습 기록을 저장하고 확인하려면 부모님 계정이 필요해요.
            </p>
          </div>

          <div className="flex rounded-card bg-brand-soft p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setMessage(null);
                }}
                className={`min-h-11 flex-1 rounded-[0.7rem] font-semibold transition-colors ${
                  mode === m ? "bg-surface text-brand" : "text-ink-soft"
                }`}
              >
                {m === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-soft">
              이메일
              <span className="flex items-center gap-2 rounded-card border-2 border-brand-soft bg-surface px-4 focus-within:border-brand">
                <Mail className="h-5 w-5 text-ink-soft" aria-hidden="true" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="min-h-12 flex-1 bg-transparent text-base text-ink outline-none"
                />
              </span>
            </label>

            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-soft">
              비밀번호
              <span className="flex items-center gap-2 rounded-card border-2 border-brand-soft bg-surface px-4 focus-within:border-brand">
                <Lock className="h-5 w-5 text-ink-soft" aria-hidden="true" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상"
                  className="min-h-12 flex-1 bg-transparent text-base text-ink outline-none"
                />
              </span>
            </label>

            {error && (
              <p className="rounded-card bg-gentle/15 px-4 py-3 text-sm text-gentle" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-card bg-success/15 px-4 py-3 text-sm text-success" role="status">
                {message}
              </p>
            )}

            <Button type="submit" variant="primary" disabled={loading}>
              {loading && (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              )}
              {mode === "login" ? "로그인" : "회원가입"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="불러오는 중" />
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function friendlyAuthError(raw: string): string {
  if (raw.includes("Invalid login credentials"))
    return "이메일 또는 비밀번호가 맞지 않아요.";
  if (raw.includes("already registered") || raw.includes("already been registered"))
    return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (raw.includes("Email not confirmed"))
    return "메일의 확인 링크를 먼저 눌러주세요.";
  return raw;
}
