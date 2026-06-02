import { Type, type Schema } from "@google/genai";

export const analyzeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    read_confidence: {
      type: Type.NUMBER,
      description: "사진 속 문제를 정확히 읽었다는 확신도 0~1",
    },
    extracted_question: {
      type: Type.STRING,
      description: "사진에서 읽어낸 수학 문제 원문 (문제만, 이름 등 제외)",
    },
    is_math_problem: {
      type: Type.BOOLEAN,
      description: "사진이 수학 문제인지 여부",
    },
  },
  required: ["read_confidence", "extracted_question", "is_math_problem"],
};

const curriculumSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    grade: { type: Type.STRING },
    semester: { type: Type.STRING },
    unit: { type: Type.STRING },
    concept: { type: Type.STRING },
  },
  required: ["grade", "semester", "unit", "concept"],
};

export const similarQuestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    correct_answer: {
      type: Type.STRING,
      description: "독립 검산으로 확정된 정답",
    },
    hint: {
      type: Type.STRING,
      description: "오답 시 줄 힌트 (정답을 직접 노출하지 않음)",
    },
  },
  required: ["question", "correct_answer", "hint"],
};

export const verifyOneSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: "주어진 문제를 처음부터 독립적으로 다시 풀어 구한 최종 답(단위 포함)",
    },
  },
  required: ["answer"],
};

export const solveGenSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    curriculum: curriculumSchema,
    step_by_step_solution: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "한 단계당 한 가지 생각으로 나눈 풀이 배열",
    },
    final_answer: { type: Type.STRING },
    similar_question: similarQuestionSchema,
  },
  required: [
    "curriculum",
    "step_by_step_solution",
    "final_answer",
    "similar_question",
  ],
};

export const verifySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    main_answer: {
      type: Type.STRING,
      description: "주어진 문제를 처음부터 독립적으로 다시 풀어 구한 최종 답",
    },
    similar_answer: {
      type: Type.STRING,
      description: "유사 문제를 처음부터 독립적으로 풀어 구한 최종 답",
    },
  },
  required: ["main_answer", "similar_answer"],
};
