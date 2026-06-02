import { create } from "zustand";
import type {
  AnalyzeResponse,
  AnalyzeStatus,
  SolveResult,
} from "@/types/analyze";

export type ChallengeStatus = "idle" | "active" | "solved";

interface AnalyzeState {
  imageBase64: string | null;
  imageMimeType: string | null;
  previewUrl: string | null;
  analyzeResult: AnalyzeResponse | null;
  solveResult: SolveResult | null;
  status: AnalyzeStatus;
  challengeStatus: ChallengeStatus;
  error: string | null;

  setImage: (base64: string, mimeType: string, previewUrl: string) => void;
  setAnalyzeResult: (result: AnalyzeResponse) => void;
  setSolveResult: (result: SolveResult) => void;
  setStatus: (status: AnalyzeStatus) => void;
  setChallengeStatus: (status: ChallengeStatus) => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

export const useAnalyzeStore = create<AnalyzeState>((set) => ({
  imageBase64: null,
  imageMimeType: null,
  previewUrl: null,
  analyzeResult: null,
  solveResult: null,
  status: "idle",
  challengeStatus: "idle",
  error: null,

  setImage: (base64, mimeType, previewUrl) =>
    set({ imageBase64: base64, imageMimeType: mimeType, previewUrl, error: null }),
  setAnalyzeResult: (result) => set({ analyzeResult: result }),
  setSolveResult: (result) => set({ solveResult: result, challengeStatus: "idle" }),
  setStatus: (status) => set({ status }),
  setChallengeStatus: (challengeStatus) => set({ challengeStatus }),
  setError: (message) =>
    set(message ? { error: message, status: "error" } : { error: null }),
  reset: () =>
    set({
      imageBase64: null,
      imageMimeType: null,
      previewUrl: null,
      analyzeResult: null,
      solveResult: null,
      status: "idle",
      challengeStatus: "idle",
      error: null,
    }),
}));
