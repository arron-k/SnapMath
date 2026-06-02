"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { SolutionSteps } from "@/components/solution/SolutionSteps";
import { ChallengeSection } from "@/components/challenge/ChallengeSection";
import { Button } from "@/components/ui/Button";
import { useAnalyzeStore } from "@/stores/analyzeStore";

interface SolutionViewProps {
  onRestart: () => void;
}

export function SolutionView({ onRestart }: SolutionViewProps) {
  const { solveResult, challengeStatus, setChallengeStatus } = useAnalyzeStore();
  const [expanded, setExpanded] = useState(false);
  const solutionRef = useRef<HTMLDivElement>(null);

  const handleAllRevealed = useCallback(() => {
    if (solveResult?.verified) setChallengeStatus("active");
  }, [solveResult, setChallengeStatus]);

  const reviewSolution = useCallback(() => {
    setExpanded(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    solutionRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  if (!solveResult) return null;

  if (!solveResult.verified) {
    return (
      <div className="flex flex-col gap-4">
        <SolutionSteps />
        <Button variant="ghost" className="self-start" onClick={onRestart}>
          <RotateCcw className="h-5 w-5" aria-hidden="true" /> 처음으로
        </Button>
      </div>
    );
  }

  const challengeOn = challengeStatus !== "idle";

  return (
    <div className="flex flex-col gap-6">
      <div ref={solutionRef}>
        <SolutionSteps
          mode={challengeOn ? "collapsible" : "reveal"}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          onAllRevealed={handleAllRevealed}
        />
      </div>

      <AnimatePresence>
        {challengeOn && (
          <ChallengeSection
            onReviewSolution={reviewSolution}
            onRestart={onRestart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
