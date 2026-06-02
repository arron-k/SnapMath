import { NextResponse } from "next/server";
import { similarQuestionSchema, verifyOneSchema } from "@/lib/gemini/schema";
import {
  buildSimilarSystemPrompt,
  VERIFY_ONE_SYSTEM_PROMPT,
} from "@/lib/gemini/prompts";
import { generateJson } from "@/lib/utils/generateWithRetry";
import { answersMatch } from "@/lib/utils/normalizeAnswer";
import { MODEL_CHAIN } from "@/lib/constants";
import {
  findReusableQuestion,
  toSmallint,
  upsertVerifiedQuestion,
} from "@/lib/questionPool";
import type { Curriculum, SimilarQuestion } from "@/types/analyze";

interface SimilarRequestBody {
  question?: string;
  curriculum?: Curriculum;
  avoid?: string[];
}

interface VerifyOneResult {
  answer: string;
}

export async function POST(request: Request) {
  let body: SimilarRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청을 읽지 못했어요. 한 번 더 시도해줄래?" },
      { status: 400 },
    );
  }

  const curriculum = body.curriculum;
  if (!curriculum?.unit || !curriculum?.grade) {
    return NextResponse.json(
      { error: "어떤 단원의 문제를 낼지 알 수 없어요." },
      { status: 400 },
    );
  }

  const avoid = [body.question, ...(body.avoid ?? [])]
    .filter((q): q is string => typeof q === "string" && q.trim() !== "")
    .slice(0, 6);

  const reused = await findReusableQuestion({
    grade: toSmallint(curriculum.grade),
    semester: toSmallint(curriculum.semester),
    unit: curriculum.unit,
    concept: curriculum.concept,
    avoid,
  });

  if (reused && reused.final_answer) {
    const similar_question: SimilarQuestion = {
      question: reused.question_text,
      correct_answer: reused.final_answer,
      hint: reused.hint ?? "",
    };
    return NextResponse.json({
      similar_question,
      question_id: reused.id,
      reused: true,
    });
  }

  try {
    const gen = await generateJson<SimilarQuestion>({
      chain: MODEL_CHAIN,
      systemInstruction: buildSimilarSystemPrompt(curriculum, avoid),
      responseSchema: similarQuestionSchema,
      content: [{ text: "위 단원에 맞는 새 유사 문제를 하나 만들어줘." }],
    });

    const verify = await generateJson<VerifyOneResult>({
      chain: MODEL_CHAIN,
      systemInstruction: VERIFY_ONE_SYSTEM_PROMPT,
      responseSchema: verifyOneSchema,
      content: [
        { text: `다음 문제를 처음부터 직접 풀어 최종 답만 알려줘:\n${gen.question}` },
      ],
    });

    const verified = answersMatch(gen.correct_answer, verify.answer);

    const similar_question: SimilarQuestion = {
      question: gen.question,
      correct_answer: verified ? gen.correct_answer : verify.answer,
      hint: gen.hint,
    };

    let question_id: string | null = null;
    if (verified) {
      question_id = await upsertVerifiedQuestion({
        source: "generated",
        question_text: similar_question.question,
        grade: toSmallint(curriculum.grade),
        semester: toSmallint(curriculum.semester),
        unit: curriculum.unit,
        concept: curriculum.concept,
        final_answer: similar_question.correct_answer,
        hint: similar_question.hint,
      });
    }

    return NextResponse.json({ similar_question, question_id, reused: false });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[/api/similar]", err);
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
        { error: "지금은 새 문제를 만들기 어려워요. 잠시 후 다시 해볼까?" },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "새 문제를 만드는 데 어려움이 있었어요. 다시 시도해줄래?" },
      { status: 500 },
    );
  }
}
