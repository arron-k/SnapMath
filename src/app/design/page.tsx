"use client";

import { Camera, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MathText } from "@/components/math/MathText";

export default function DesignShowcase() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">디자인 시스템</h1>
          <p className="text-sm text-ink-soft">2-1 컴포넌트 · 다크모드 · 접근성</p>
        </div>
        <ThemeToggle />
      </header>

      <Card as="section">
        <h2 className="mb-4 text-lg font-semibold">버튼</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">
            <Camera className="h-5 w-5" aria-hidden="true" /> 사진 찍기
          </Button>
          <Button variant="accent">
            <ImageIcon className="h-5 w-5" aria-hidden="true" /> 사진 올리기
          </Button>
          <Button variant="ghost">다시 찍기</Button>
          <Button variant="primary" size="md">
            작은 버튼
          </Button>
          <Button variant="primary" disabled>
            비활성
          </Button>
        </div>
      </Card>

      <Card as="section">
        <h2 className="mb-4 text-lg font-semibold">컬러 토큰</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["brand", "bg-brand text-white"],
            ["accent", "bg-accent text-ink"],
            ["success", "bg-success text-white"],
            ["gentle", "bg-gentle text-white"],
            ["brand-soft", "bg-brand-soft text-ink"],
            ["surface-soft", "bg-surface-soft text-ink border border-brand-soft"],
          ].map(([name, cls]) => (
            <div
              key={name}
              className={`flex h-16 items-center justify-center rounded-card text-sm font-medium ${cls}`}
            >
              {name}
            </div>
          ))}
        </div>
      </Card>

      <Card as="section">
        <h2 className="mb-4 text-lg font-semibold">로딩 인디케이터</h2>
        <div className="flex flex-wrap items-center gap-8">
          <Spinner label="불러오는 중" />
          <LoadingDots label="스냅이가 문제 읽는 중…" />
        </div>
      </Card>

      <Card as="section">
        <h2 className="mb-4 text-lg font-semibold">수식 렌더 (KaTeX)</h2>
        <div className="space-y-2 text-lg text-ink">
          <MathText>{"분수: 전체 케이크의 $\\frac{3}{4}$ 를 먹었어요."}</MathText>
          <MathText>{"소수와 곱셈: $1.5 \\times 4 = 6$ 입니다."}</MathText>
          <MathText>{"각도: 직각은 $90^\\circ$, 평각은 $180^\\circ$ 예요."}</MathText>
          <MathText>{"분수 덧셈: $\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}$"}</MathText>
          <MathText>{"블록 수식: $$\\frac{12}{4} = 3$$"}</MathText>
        </div>
      </Card>

      <Card as="section">
        <h2 className="mb-4 text-lg font-semibold">상태 표시 (색 + 아이콘 이중)</h2>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-card bg-success px-4 py-2 font-medium text-white">
            <Check className="h-5 w-5" aria-hidden="true" /> 정답이에요!
          </span>
          <span className="inline-flex items-center gap-2 rounded-card bg-brand-soft px-4 py-2 font-medium text-gentle">
            💡 거의 다 왔어! 여기만 다시 볼까?
          </span>
        </div>
      </Card>
    </main>
  );
}
