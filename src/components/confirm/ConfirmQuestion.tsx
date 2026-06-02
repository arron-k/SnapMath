"use client";

import Image from "next/image";
import { Check, RotateCcw, Camera } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAnalyzeStore } from "@/stores/analyzeStore";

interface ConfirmQuestionProps {
  onConfirm: (question: string) => void;
  onRetake: () => void;
}

export function ConfirmQuestion({ onConfirm, onRetake }: ConfirmQuestionProps) {
  const { analyzeResult, previewUrl } = useAnalyzeStore();
  if (!analyzeResult) return null;

  if (analyzeResult.needs_retake) {
    return (
      <Card className="flex flex-col items-center gap-5 text-center">
        <span className="text-5xl" role="img" aria-label="스냅이">
          🦊
        </span>
        <p className="text-xl font-semibold text-ink">
          사진이 잘 안 보여요. 한 번 더 찍어줄래?
        </p>
        <p className="text-base text-ink-soft">
          글씨가 또렷하게 보이게, 밝은 곳에서 찍으면 더 잘 읽을 수 있어!
        </p>
        <Button variant="primary" onClick={onRetake}>
          <Camera className="h-5 w-5" aria-hidden="true" /> 다시 찍기
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="text-3xl" role="img" aria-label="스냅이">
          🦊
        </span>
        <p className="text-lg font-medium text-ink">
          이 문제 맞아? 내가 잘 읽었는지 확인해줘!
        </p>
      </div>

      {previewUrl && (
        <div className="relative mx-auto h-40 w-full max-w-sm overflow-hidden rounded-card border border-brand-soft">
          <Image
            src={previewUrl}
            alt="올린 수학 문제 사진"
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      )}

      <p
        className="rounded-card bg-brand-soft px-5 py-4 text-2xl font-semibold leading-relaxed text-ink"
        aria-live="polite"
      >
        {analyzeResult.extracted_question}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => onConfirm(analyzeResult.extracted_question)}
        >
          <Check className="h-5 w-5" aria-hidden="true" /> 응, 맞아!
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onRetake}>
          <RotateCcw className="h-5 w-5" aria-hidden="true" /> 다시 찍을래
        </Button>
      </div>
    </Card>
  );
}
