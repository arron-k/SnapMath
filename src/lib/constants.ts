import type { ModelRef } from "@/lib/llm/content";

export const READ_CONFIDENCE_THRESHOLD = 0.6;

const DEFAULT_MODEL_CHAIN = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

function parseList(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) return fallback;
  const parsed = raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : fallback;
}

export const GEMINI_MODELS: string[] = parseList(
  process.env.GEMINI_MODELS ?? process.env.GEMINI_MODEL,
  DEFAULT_MODEL_CHAIN,
);

const DEFAULT_GROQ_MODELS = ["meta-llama/llama-4-scout-17b-16e-instruct"];

export const GROQ_MODELS: string[] = process.env.GROQ_API_KEY
  ? parseList(process.env.GROQ_MODELS, DEFAULT_GROQ_MODELS)
  : [];

export const MODEL_CHAIN: ModelRef[] = [
  ...GEMINI_MODELS.map((model) => ({ provider: "gemini" as const, model })),
  ...GROQ_MODELS.map((model) => ({ provider: "groq" as const, model })),
];
