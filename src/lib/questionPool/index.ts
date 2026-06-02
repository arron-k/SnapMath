import "server-only";
import { getServiceSupabase } from "@/lib/supabase/admin";
import type { QuestionRow } from "@/types/database";
import { containsLikelyPII, questionHash, normalizeQuestionText } from "./normalize";
import type {
  CurationFilter,
  PoolQuestion,
  ReuseCriteria,
  ReviewStatus,
  QuestionSource,
  UpsertQuestionInput,
} from "./types";

export type {
  PoolQuestion,
  ReuseCriteria,
  ReviewStatus,
  QuestionSource,
  UpsertQuestionInput,
  CurationFilter,
} from "./types";

export function toSmallint(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const digits = value.match(/\d+/);
  return digits ? Number(digits[0]) : null;
}

function toPoolQuestion(row: QuestionRow): PoolQuestion {
  return {
    id: row.id,
    source: (row.source === "uploaded" ? "uploaded" : "generated") as QuestionSource,
    question_text: row.question_text,
    grade: row.grade,
    semester: row.semester,
    unit: row.unit,
    concept: row.concept,
    difficulty: row.difficulty,
    solution_steps: row.solution_steps,
    final_answer: row.final_answer,
    hint: row.hint,
    verified: row.verified,
    review_status: (["auto", "approved", "flagged"].includes(row.review_status)
      ? row.review_status
      : "auto") as ReviewStatus,
    usage_count: row.usage_count,
    created_at: row.created_at,
  };
}

export async function upsertVerifiedQuestion(
  input: UpsertQuestionInput,
): Promise<string | null> {
  const text = input.question_text?.trim();
  if (!text || containsLikelyPII(text)) return null;

  const supabase = getServiceSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("upsert_question", {
      p_source: input.source,
      p_question_text: text,
      p_normalized_hash: questionHash(text),
      p_grade: input.grade ?? null,
      p_semester: input.semester ?? null,
      p_unit: input.unit ?? null,
      p_concept: input.concept ?? null,
      p_difficulty: input.difficulty ?? null,
      p_solution_steps: input.solution_steps ?? null,
      p_final_answer: input.final_answer ?? null,
      p_hint: input.hint ?? null,
    });
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[questionPool.upsert]", error.message);
      }
      return null;
    }
    return typeof data === "string" ? data : null;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[questionPool.upsert]", err);
    }
    return null;
  }
}

export async function findReusableQuestion(
  criteria: ReuseCriteria,
): Promise<PoolQuestion | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  try {
    let query = supabase
      .from("questions")
      .select("*")
      .eq("verified", true)
      .neq("review_status", "flagged")
      .eq("source", "generated")
      .eq("unit", criteria.unit);

    if (criteria.grade != null) query = query.eq("grade", criteria.grade);
    if (criteria.concept) query = query.eq("concept", criteria.concept);

    const { data, error } = await query
      .order("usage_count", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) return null;

    const avoidHashes = new Set(
      (criteria.avoid ?? [])
        .filter((q) => typeof q === "string" && q.trim() !== "")
        .map((q) => normalizeQuestionText(q)),
    );

    const pick = data.find(
      (row) => !avoidHashes.has(normalizeQuestionText(row.question_text)),
    );
    return pick ? toPoolQuestion(pick) : null;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[questionPool.find]", err);
    }
    return null;
  }
}

export async function listQuestions(
  filter: CurationFilter = {},
): Promise<PoolQuestion[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  try {
    let query = supabase.from("questions").select("*");
    if (filter.unit) query = query.eq("unit", filter.unit);
    if (filter.reviewStatus) query = query.eq("review_status", filter.reviewStatus);
    if (filter.search) query = query.ilike("question_text", `%${filter.search}%`);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(filter.limit ?? 100);

    if (error || !data) return [];
    return data.map(toPoolQuestion);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[questionPool.list]", err);
    }
    return [];
  }
}

export async function setReviewStatus(
  id: string,
  status: ReviewStatus,
): Promise<boolean> {
  const supabase = getServiceSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("questions")
      .update({ review_status: status })
      .eq("id", id);
    return !error;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[questionPool.setReviewStatus]", err);
    }
    return false;
  }
}
