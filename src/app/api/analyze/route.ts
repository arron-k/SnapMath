import { NextResponse } from "next/server";
import { analyzeSchema } from "@/lib/gemini/schema";
import { ANALYZE_SYSTEM_PROMPT } from "@/lib/gemini/prompts";
import { generateJson } from "@/lib/utils/generateWithRetry";
import { MODEL_CHAIN, READ_CONFIDENCE_THRESHOLD } from "@/lib/constants";
import type { AnalyzeResult } from "@/types/analyze";

interface AnalyzeRequestBody {
  imageBase64?: string;
  mimeType?: string;
}

export interface AnalyzeApiResponse extends AnalyzeResult {
  needs_retake: boolean;
}

export async function POST(request: Request) {
  let body: AnalyzeRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청을 읽지 못했어요. 한 번 더 시도해줄래?" },
      { status: 400 },
    );
  }

  const { imageBase64, mimeType } = body;
  if (!imageBase64 || !mimeType) {
    return NextResponse.json(
      { error: "사진이 없어요. 먼저 사진을 올려줄래?" },
      { status: 400 },
    );
  }

  try {
    const result = await generateJson<AnalyzeResult>({
      chain: MODEL_CHAIN,
      systemInstruction: ANALYZE_SYSTEM_PROMPT,
      responseSchema: analyzeSchema,
      content: [
        { text: "이 사진 속 수학 문제를 정확히 읽어줘." },
        { image: { mimeType, base64: imageBase64 } },
      ],
    });

    const needs_retake =
      !result.is_math_problem ||
      result.read_confidence < READ_CONFIDENCE_THRESHOLD;

    const response: AnalyzeApiResponse = { ...result, needs_retake };
    return NextResponse.json(response);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[/api/analyze]", err);
    }
    const message = err instanceof Error ? err.message : "";

    if (message === "MISSING_API_KEY") {
      return NextResponse.json(
        { error: "AI 연결이 아직 준비되지 않았어요. 잠시 후 다시 시도해줘." },
        { status: 503 },
      );
    }
    if (message === "RATE_LIMIT") {
      return NextResponse.json(
        { error: "지금 친구들이 많이 물어보고 있어요. 잠시 후 다시 시도해줄래?" },
        { status: 429 },
      );
    }
    if (message === "PARSE_FAILED") {
      const fallback: AnalyzeApiResponse = {
        read_confidence: 0,
        extracted_question: "",
        is_math_problem: false,
        needs_retake: true,
      };
      return NextResponse.json(fallback);
    }
    return NextResponse.json(
      { error: "사진을 읽는 데 문제가 생겼어요. 다시 한 번 시도해줄래?" },
      { status: 500 },
    );
  }
}
