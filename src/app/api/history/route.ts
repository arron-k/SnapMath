import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

interface HistoryBody {
  child_profile_id?: string;
  question_id?: string | null;
  grade?: string | number | null;
  semester?: string | number | null;
  unit?: string | null;
  concept?: string | null;
  question_text?: string | null;
  is_correct?: boolean;
  attempts?: number;
  time_spent_s?: number;
}

function toSmallint(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 200 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  let body: HistoryBody;
  try {
    body = (await request.json()) as HistoryBody;
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (!body.child_profile_id) {
    return NextResponse.json({ error: "MISSING_CHILD" }, { status: 400 });
  }

  const { error } = await supabase.from("learning_history").insert({
    child_profile_id: body.child_profile_id,
    question_id: body.question_id ?? null,
    grade: toSmallint(body.grade),
    semester: toSmallint(body.semester),
    unit: body.unit ?? null,
    concept: body.concept ?? null,
    question_text: body.question_text ?? null,
    is_correct: body.is_correct ?? null,
    attempts: body.attempts ?? null,
    time_spent_s: body.time_spent_s ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
