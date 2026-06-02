"use client";

import { Camera, Crop, Check, Sparkles, PencilLine, Loader2 } from "lucide-react";
import type { AnalyzeStatus } from "@/types/analyze";
import type { ChallengeStatus } from "@/stores/analyzeStore";

const STEPS = [
  { key: "photo", label: "사진", Icon: Camera },
  { key: "region", label: "영역 지정", Icon: Crop },
  { key: "confirm", label: "문제 확인", Icon: Check },
  { key: "solve", label: "풀이", Icon: Sparkles },
  { key: "challenge", label: "도전", Icon: PencilLine },
] as const;

const STATUS_TO_STEP: Record<
  AnalyzeStatus,
  { active: number; loading: boolean }
> = {
  idle: { active: 0, loading: false },
  cropping: { active: 1, loading: false },
  reading: { active: 2, loading: true },
  confirming: { active: 2, loading: false },
  solving: { active: 3, loading: true },
  done: { active: 3, loading: false },
  error: { active: 0, loading: false },
};

interface ProgressStepperProps {
  status: AnalyzeStatus;
  challengeStatus?: ChallengeStatus;
}

export function ProgressStepper({
  status,
  challengeStatus = "idle",
}: ProgressStepperProps) {
  const base = STATUS_TO_STEP[status];
  const allDone = status === "done" && challengeStatus === "solved";
  const active =
    status === "done" && challengeStatus !== "idle" ? 4 : base.active;
  const loading = base.loading;

  return (
    <ol
      className="flex items-center justify-between gap-1"
      aria-label="진행 단계"
    >
      {STEPS.map((step, i) => {
        const isDone = i < active || allDone;
        const isCurrent = i === active && !isDone;
        const showSpinner = isCurrent && loading;

        const circle = isDone
          ? "bg-success text-white"
          : isCurrent
            ? "bg-brand text-white"
            : "bg-surface-soft text-ink-soft border border-brand-soft";

        const Icon = showSpinner ? Loader2 : isDone ? Check : step.Icon;

        return (
          <li
            key={step.key}
            className="flex flex-1 flex-col items-center gap-1"
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : isDone || isCurrent ? "bg-brand" : "bg-brand-soft"}`}
                aria-hidden="true"
              />
              <span
                className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${circle}`}
              >
                <Icon
                  className={`h-5 w-5 ${showSpinner ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
              </span>
              <span
                className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "opacity-0" : i < active ? "bg-brand" : "bg-brand-soft"}`}
                aria-hidden="true"
              />
            </div>
            <span
              className={`text-xs font-medium ${isCurrent ? "text-brand" : isDone ? "text-success" : "text-ink-soft"}`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
