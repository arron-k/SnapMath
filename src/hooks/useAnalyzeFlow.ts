"use client";

import { useCallback } from "react";
import { useAnalyzeStore } from "@/stores/analyzeStore";
import { imageToBase64, validateImageFile } from "@/lib/utils/imageToBase64";
import type { AnalyzeApiResponse } from "@/app/api/analyze/route";
import type { SolveResult } from "@/types/analyze";

export function useAnalyzeFlow() {
  const {
    imageBase64,
    imageMimeType,
    previewUrl,
    setImage,
    setAnalyzeResult,
    setSolveResult,
    setStatus,
    setError,
    reset,
  } = useAnalyzeStore();

  const pickImage = useCallback(
    async (file: File) => {
      const invalid = validateImageFile(file);
      if (invalid) {
        setError(invalid.message);
        return;
      }
      try {
        const { base64, dataUrl, mimeType } = await imageToBase64(file);
        setImage(base64, mimeType, dataUrl);
        setStatus("cropping");
      } catch {
        setError("사진을 읽지 못했어요. 한 번 더 시도해줄래?");
      }
    },
    [setImage, setStatus, setError],
  );

  const analyzeImage = useCallback(
    async (base64: string, mimeType: string, previewDataUrl: string) => {
      setImage(base64, mimeType, previewDataUrl);
      setStatus("reading");
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "사진을 읽는 데 어려움이 있었어요.");
          return;
        }
        setAnalyzeResult(data as AnalyzeApiResponse);
        setStatus("confirming");
      } catch {
        setError("사진을 읽지 못했어요. 한 번 더 시도해줄래?");
      }
    },
    [setImage, setStatus, setAnalyzeResult, setError],
  );

  const solve = useCallback(
    async (question: string) => {
      setStatus("solving");
      setError(null);
      try {
        const res = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            imageBase64: imageBase64 ?? undefined,
            mimeType: imageMimeType ?? undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "문제를 푸는 데 어려움이 있었어요.");
          return;
        }
        setSolveResult(data as SolveResult);
        setStatus("done");
      } catch {
        setError("문제를 푸는 데 어려움이 있었어요. 다시 시도해줄래?");
      }
    },
    [imageBase64, imageMimeType, setStatus, setSolveResult, setError],
  );

  const analyzeFull = useCallback(() => {
    if (!imageBase64 || !imageMimeType || !previewUrl) return;
    analyzeImage(imageBase64, imageMimeType, previewUrl);
  }, [imageBase64, imageMimeType, previewUrl, analyzeImage]);

  return {
    imageBase64,
    imageMimeType,
    pickImage,
    analyzeImage,
    analyzeFull,
    solve,
    restart: reset,
  };
}
