import { NextResponse } from "next/server";
import { solveGenSchema, verifyOneSchema } from "@/lib/gemini/schema";
import {
  buildSolveSystemPrompt,
  VERIFY_CAREFUL_ONE_SYSTEM_PROMPT,
} from "@/lib/gemini/prompts";
import { generateJson } from "@/lib/utils/generateWithRetry";
import { answersMatch } from "@/lib/utils/normalizeAnswer";
import { MODEL_CHAIN } from "@/lib/constants";
import { toSmallint, upsertVerifiedQuestion } from "@/lib/questionPool";
import type { LlmContent } from "@/lib/llm/content";
import type {
  Curriculum,
  SimilarQuestion,
  SolveResult,
} from "@/types/analyze";

interface SolveRequestBody {
  question?: string;
  imageBase64?: string;
  mimeType?: string;
}

interface SolveGenResult {
  curriculum: Curriculum;
  step_by_step_solution: string[];
  final_answer: string;
  similar_question: SimilarQuestion;
}

interface VerifyOneResult {
  answer: string;
}

export async function POST(request: Request) {
  let body: SolveRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청을 읽지 못했어요. 한 번 더 시도해줄래?" },
      { status: 400 },
    );
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json(
      { error: "풀 문제가 없어요. 먼저 문제를 확인해줄래?" },
      { status: 400 },
    );
  }

  const hasImage = Boolean(body.imageBase64 && body.mimeType);
  const imagePart: LlmContent = hasImage
    ? [{ image: { mimeType: body.mimeType!, base64: body.imageBase64! } }]
    : [];

  const carefulCheck = (text: string, withImage: boolean) =>
    generateJson<VerifyOneResult>({
      chain: MODEL_CHAIN,
      systemInstruction: VERIFY_CAREFUL_ONE_SYSTEM_PROMPT,
      responseSchema: verifyOneSchema,
      content: [
        { text: `다음 문제를 처음부터 직접 풀어 최종 답만 알려줘:\n${text}` },
        ...(withImage ? imagePart : []),
      ],
    });

  try {
    const gen = await generateJson<SolveGenResult>({
      chain: MODEL_CHAIN,
      systemInstruction: buildSolveSystemPrompt(),
      responseSchema: solveGenSchema,
      content: [{ text: `다음 문제를 풀어줘:\n${question}` }, ...imagePart],
    });

    // 독립 검산(다수결): 풀이만큼 꼼꼼히 다시 푼 답과 일치해야 통과. 1차 불일치 시 1회 더.
    const check1 = await carefulCheck(question, true);
    let verified = answersMatch(gen.final_answer, check1.answer);
    if (!verified) {
      const check2 = await carefulCheck(question, true);
      verified = answersMatch(gen.final_answer, check2.answer);
    }

    const similarCheck = await carefulCheck(gen.similar_question.question, false);
    const similarVerified = answersMatch(
      gen.similar_question.correct_answer,
      similarCheck.answer,
    );

    const result: SolveResult = {
      curriculum: gen.curriculum,
      step_by_step_solution: gen.step_by_step_solution,
      final_answer: gen.final_answer,
      verified,
      similar_question: {
        question: gen.similar_question.question,
        correct_answer: similarVerified
          ? gen.similar_question.correct_answer
          : similarCheck.answer,
        hint: gen.similar_question.hint,
      },
    };

    const grade = toSmallint(gen.curriculum.grade);
    const semester = toSmallint(gen.curriculum.semester);
    if (verified) {
      result.question_id = await upsertVerifiedQuestion({
        source: "uploaded",
        question_text: question,
        grade,
        semester,
        unit: gen.curriculum.unit,
        concept: gen.curriculum.concept,
        solution_steps: gen.step_by_step_solution,
        final_answer: gen.final_answer,
      });
    }
    if (similarVerified) {
      result.similar_question_id = await upsertVerifiedQuestion({
        source: "generated",
        question_text: result.similar_question.question,
        grade,
        semester,
        unit: gen.curriculum.unit,
        concept: gen.curriculum.concept,
        final_answer: result.similar_question.correct_answer,
        hint: result.similar_question.hint,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[/api/solve]", err);
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
      return NextResponse.json(
        {
          error:
            "이 문제는 내가 아직 자신이 없어. 선생님이나 부모님께 같이 물어보자!",
          verified: false,
        },
        { status: 200 },
      );
    }
    return NextResponse.json(
      { error: "문제를 푸는 데 어려움이 있었어요. 다시 한 번 시도해줄래?" },
      { status: 500 },
    );
  }
}
