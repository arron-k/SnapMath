"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useAnalyzeStore } from "@/stores/analyzeStore";
import { useAnalyzeFlow } from "@/hooks/useAnalyzeFlow";
import { useStartGuard } from "@/hooks/useStartGuard";
import { ProgressStepper } from "@/components/flow/ProgressStepper";
import { UploadButtons } from "@/components/home/UploadButtons";
import { LearnerBanner } from "@/components/learner/LearnerBanner";
import { RegionSelect } from "@/components/region/RegionSelect";
import { ConfirmQuestion } from "@/components/confirm/ConfirmQuestion";
import { SolutionView } from "@/components/solution/SolutionView";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const { status, challengeStatus, error, analyzeResult, imageBase64 } =
    useAnalyzeStore();
  const { pickImage, analyzeImage, analyzeFull, solve, restart } =
    useAnalyzeFlow();
  const canStart = useStartGuard();

  const canRetrySolve =
    analyzeResult !== null && !analyzeResult.needs_retake;
  const canRetryRead = !canRetrySolve && imageBase64 !== null;

  const showStepper = status !== "idle" && status !== "error";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      {showStepper && (
        <div className="rounded-card border border-brand-soft bg-surface-soft px-4 py-3">
          <ProgressStepper status={status} challengeStatus={challengeStatus} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {status === "idle" && (
            <div className="flex flex-col items-center gap-6">
              <LearnerBanner />
              <UploadButtons onPick={pickImage} canStart={canStart} />
            </div>
          )}

          {status === "cropping" && (
            <RegionSelect
              onUseRegion={analyzeImage}
              onUseFull={analyzeFull}
              onRetake={restart}
            />
          )}

          {status === "reading" && (
            <LoadingCard message="스냅이가 문제 읽는 중…" />
          )}

          {status === "confirming" && (
            <ConfirmQuestion onConfirm={solve} onRetake={restart} />
          )}

          {status === "solving" && (
            <LoadingCard message="스냅이가 푸는 중…" />
          )}

          {status === "done" && <SolutionView onRestart={restart} />}

          {status === "error" && (
            <Card className="flex flex-col items-center gap-4 text-center">
              <span className="text-4xl" role="img" aria-label="다시">
                🙂
              </span>
              <p className="text-lg text-ink" role="alert">
                {error}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {canRetrySolve && (
                  <Button
                    variant="primary"
                    onClick={() => solve(analyzeResult.extracted_question)}
                  >
                    <RotateCcw className="h-5 w-5" aria-hidden="true" /> 다시
                    풀어보기
                  </Button>
                )}
                {canRetryRead && (
                  <Button variant="primary" onClick={analyzeFull}>
                    <RotateCcw className="h-5 w-5" aria-hidden="true" /> 다시 읽기
                  </Button>
                )}
                <Button variant="ghost" onClick={restart}>
                  처음부터
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
