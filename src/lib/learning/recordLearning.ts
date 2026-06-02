import type { Curriculum } from "@/types/analyze";

export interface LearningRecord {
  childProfileId: string;
  curriculum: Curriculum;
  questionText: string;
  questionId?: string | null;
  isCorrect: boolean;
  attempts: number;
  timeSpentS: number;
}

export async function recordLearning(record: LearningRecord): Promise<void> {
  try {
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_profile_id: record.childProfileId,
        question_id: record.questionId ?? null,
        grade: record.curriculum.grade,
        semester: record.curriculum.semester,
        unit: record.curriculum.unit,
        concept: record.curriculum.concept,
        question_text: record.questionText,
        is_correct: record.isCorrect,
        attempts: record.attempts,
        time_spent_s: record.timeSpentS,
      }),
    });
  } catch {
    // 저장 실패는 학습 흐름을 막지 않는다(1회성으로 진행).
  }
}
