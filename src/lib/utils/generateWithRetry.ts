import "server-only";
import type { Schema } from "@google/genai";
import type { LlmContent, ModelRef } from "@/lib/llm/content";
import { geminiGenerate } from "@/lib/llm/gemini";
import { groqGenerate } from "@/lib/llm/groq";

export interface GenerateJsonParams {
  chain: ModelRef[];
  content: LlmContent;
  systemInstruction: string;
  responseSchema: Schema;
}

const MAX_BACKOFF_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimit(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { status?: number; message?: string };
  if (e.status === 429) return true;
  const msg = e.message ?? "";
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

function isOverloaded(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { status?: number; message?: string };
  if (e.status === 503 || e.status === 500) return true;
  const msg = e.message ?? "";
  return (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("overloaded") ||
    msg.includes("high demand")
  );
}

function isBadJson(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { status?: number; message?: string };
  const msg = e.message ?? "";
  return e.status === 400 && msg.includes("json_validate_failed");
}

function isTransient(err: unknown): boolean {
  return isRateLimit(err) || isOverloaded(err) || isBadJson(err);
}

function isMissingKey(err: unknown): boolean {
  return err instanceof Error && err.message === "MISSING_API_KEY";
}

function reason(err: unknown): string {
  if (isMissingKey(err)) return "키 없음";
  if (isRateLimit(err)) return "한도(429)";
  if (isOverloaded(err)) return "과부하(5xx)";
  if (isBadJson(err)) return "JSON 검증 실패(400)";
  if (err instanceof Error && err.message === "PARSE_FAILED") return "JSON 파싱 실패";
  return err instanceof Error ? err.message : "알 수 없는 오류";
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function callOnce(ref: ModelRef, params: GenerateJsonParams): Promise<string> {
  const req = {
    systemInstruction: params.systemInstruction,
    content: params.content,
    responseSchema: params.responseSchema,
  };
  return ref.provider === "groq"
    ? groqGenerate(ref.model, req)
    : geminiGenerate(ref.model, req);
}

function parseOrNull<T>(raw: string): T | null {
  try {
    return JSON.parse(stripCodeFences(raw)) as T;
  } catch {
    return null;
  }
}

async function tryModel<T>(
  ref: ModelRef,
  params: GenerateJsonParams,
  withBackoff: boolean,
): Promise<T> {
  let delay = BASE_BACKOFF_MS;
  const maxRetries = withBackoff ? MAX_BACKOFF_RETRIES : 0;

  for (let attempt = 0; ; attempt++) {
    try {
      const first = await callOnce(ref, params);
      const parsed = parseOrNull<T>(first);
      if (parsed !== null) return parsed;

      const second = await callOnce(ref, params);
      const reparsed = parseOrNull<T>(second);
      if (reparsed !== null) return reparsed;

      throw new Error("PARSE_FAILED");
    } catch (err) {
      if (isTransient(err) && attempt < maxRetries) {
        await sleep(delay);
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

export async function generateJson<T>(params: GenerateJsonParams): Promise<T> {
  const { chain } = params;
  if (chain.length === 0) throw new Error("MISSING_API_KEY");

  let lastError: unknown = new Error("RATE_LIMIT");

  for (let i = 0; i < chain.length; i++) {
    const ref = chain[i];
    const isLast = i === chain.length - 1;
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`[llm] trying ${ref.provider}:${ref.model}`);
      }
      return await tryModel<T>(ref, params, isLast);
    } catch (err) {
      lastError = err;
      if (process.env.NODE_ENV === "development") {
        console.warn(`[llm] ${ref.provider}:${ref.model} ${reason(err)} → 다음 모델`);
      }
    }
  }

  if (isMissingKey(lastError)) throw new Error("MISSING_API_KEY");
  if (isTransient(lastError)) throw new Error("RATE_LIMIT");
  throw lastError;
}
