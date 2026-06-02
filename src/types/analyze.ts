export interface AnalyzeResult {
  read_confidence: number;
  extracted_question: string;
  is_math_problem: boolean;
}

export interface AnalyzeResponse extends AnalyzeResult {
  needs_retake: boolean;
}

export interface Curriculum {
  grade: string;
  semester: string;
  unit: string;
  concept: string;
}

export interface SimilarQuestion {
  question: string;
  correct_answer: string;
  hint: string;
}

export interface SolveResult {
  curriculum: Curriculum;
  step_by_step_solution: string[];
  final_answer: string;
  verified: boolean;
  similar_question: SimilarQuestion;
  question_id?: string | null;
  similar_question_id?: string | null;
}

export type AnalyzeStatus =
  | "idle"
  | "cropping"
  | "reading"
  | "confirming"
  | "solving"
  | "done"
  | "error";
