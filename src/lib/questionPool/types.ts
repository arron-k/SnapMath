export type QuestionSource = "uploaded" | "generated";
export type ReviewStatus = "auto" | "approved" | "flagged";

export interface PoolQuestion {
  id: string;
  source: QuestionSource;
  question_text: string;
  grade: number | null;
  semester: number | null;
  unit: string | null;
  concept: string | null;
  difficulty: number | null;
  solution_steps: string[] | null;
  final_answer: string | null;
  hint: string | null;
  verified: boolean;
  review_status: ReviewStatus;
  usage_count: number;
  created_at: string;
}

export interface UpsertQuestionInput {
  source: QuestionSource;
  question_text: string;
  grade?: number | null;
  semester?: number | null;
  unit?: string | null;
  concept?: string | null;
  difficulty?: number | null;
  solution_steps?: string[] | null;
  final_answer?: string | null;
  hint?: string | null;
}

export interface ReuseCriteria {
  grade?: number | null;
  semester?: number | null;
  unit: string;
  concept?: string | null;
  avoid?: string[];
}

export interface CurationFilter {
  unit?: string | null;
  reviewStatus?: ReviewStatus | null;
  search?: string | null;
  limit?: number;
}
