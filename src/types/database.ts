export type ChildProfileRow = {
  id: string;
  parent_id: string;
  nickname: string;
  grade: number | null;
  semester: number | null;
  consent_at: string | null;
  created_at: string;
};

export type LearningHistoryRow = {
  id: string;
  child_profile_id: string;
  question_id: string | null;
  grade: number | null;
  semester: number | null;
  unit: string | null;
  concept: string | null;
  question_text: string | null;
  is_correct: boolean | null;
  attempts: number | null;
  time_spent_s: number | null;
  created_at: string;
};

type ChildProfileInsert = {
  parent_id: string;
  nickname: string;
  grade?: number | null;
  semester?: number | null;
  consent_at?: string | null;
};

type LearningHistoryInsert = {
  child_profile_id: string;
  question_id?: string | null;
  grade?: number | null;
  semester?: number | null;
  unit?: string | null;
  concept?: string | null;
  question_text?: string | null;
  is_correct?: boolean | null;
  attempts?: number | null;
  time_spent_s?: number | null;
};

export type QuestionRow = {
  id: string;
  source: string;
  question_text: string;
  normalized_hash: string | null;
  grade: number | null;
  semester: number | null;
  unit: string | null;
  concept: string | null;
  difficulty: number | null;
  solution_steps: string[] | null;
  final_answer: string | null;
  hint: string | null;
  verified: boolean;
  review_status: string;
  usage_count: number;
  created_at: string;
};

type QuestionInsert = {
  source: string;
  question_text: string;
  normalized_hash?: string | null;
  grade?: number | null;
  semester?: number | null;
  unit?: string | null;
  concept?: string | null;
  difficulty?: number | null;
  solution_steps?: string[] | null;
  final_answer?: string | null;
  hint?: string | null;
  verified?: boolean;
  review_status?: string;
  usage_count?: number;
};

type UpsertQuestionArgs = {
  p_source: string;
  p_question_text: string;
  p_normalized_hash: string;
  p_grade: number | null;
  p_semester: number | null;
  p_unit: string | null;
  p_concept: string | null;
  p_difficulty: number | null;
  p_solution_steps: string[] | null;
  p_final_answer: string | null;
  p_hint: string | null;
};

export interface Database {
  public: {
    Tables: {
      child_profiles: {
        Row: ChildProfileRow;
        Insert: ChildProfileInsert;
        Update: Partial<ChildProfileInsert>;
        Relationships: [];
      };
      learning_history: {
        Row: LearningHistoryRow;
        Insert: LearningHistoryInsert;
        Update: Partial<LearningHistoryInsert>;
        Relationships: [];
      };
      questions: {
        Row: QuestionRow;
        Insert: QuestionInsert;
        Update: Partial<QuestionInsert>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      upsert_question: {
        Args: UpsertQuestionArgs;
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
