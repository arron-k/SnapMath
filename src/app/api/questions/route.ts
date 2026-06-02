import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { listQuestions, setReviewStatus } from "@/lib/questionPool";
import type { ReviewStatus } from "@/lib/questionPool";

const VALID_STATUS: ReviewStatus[] = ["auto", "approved", "flagged"];

async function requireUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false as const, status: 200, error: "NOT_CONFIGURED" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "NOT_AUTHENTICATED" };
  return { ok: true as const };
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const reviewStatus =
    statusParam && VALID_STATUS.includes(statusParam as ReviewStatus)
      ? (statusParam as ReviewStatus)
      : null;

  const questions = await listQuestions({
    unit: searchParams.get("unit"),
    reviewStatus,
    search: searchParams.get("q"),
  });

  return NextResponse.json({ questions });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { id?: string; review_status?: string };
  try {
    body = (await request.json()) as { id?: string; review_status?: string };
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (!body.id || !VALID_STATUS.includes(body.review_status as ReviewStatus)) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const ok = await setReviewStatus(body.id, body.review_status as ReviewStatus);
  if (!ok) {
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
