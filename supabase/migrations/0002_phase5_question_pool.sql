-- SnapMath Phase 5 — 문항 풀(questions) + 신원 분리 공유 자산
-- Supabase SQL Editor에 그대로 붙여넣어 실행하세요.
-- 규칙 6: questions 에는 누가 올렸는지(아이/부모 식별자)를 저장하지 않는다. 문제·풀이·정답만.
-- 아이↔문항 연결은 learning_history.question_id 로만 이뤄진다.

-- ── 문항 풀 ───────────────────────────────────────────────────────────
create table if not exists public.questions (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,                       -- 'uploaded' | 'generated'
  question_text   text not null,
  normalized_hash text unique,                         -- 정규화 후 해시 (중복 제거)
  grade           smallint,
  semester        smallint,
  unit            text,
  concept         text,
  difficulty      smallint,                            -- 1~5 (선택)
  solution_steps  jsonb,
  final_answer    text,
  hint            text,
  verified        boolean not null default false,      -- 검산 통과분만 활성
  review_status   text not null default 'auto',        -- 'auto' | 'approved' | 'flagged'
  usage_count     integer not null default 0,
  created_at      timestamptz not null default now()
);

-- 재사용 조회용 인덱스(같은 단원·개념·검증·미격리 우선)
create index if not exists questions_reuse_idx
  on public.questions (grade, semester, unit, concept)
  where verified = true and review_status <> 'flagged';

create index if not exists questions_review_idx
  on public.questions (review_status, unit);

-- learning_history.question_id → questions(id) 연결(Phase 4에서 nullable uuid로 둔 컬럼)
alter table public.learning_history
  drop constraint if exists learning_history_question_id_fkey;
alter table public.learning_history
  add constraint learning_history_question_id_fkey
  foreign key (question_id) references public.questions(id) on delete set null;

-- ── 적재(upsert) RPC — 정규화 해시 충돌 시 usage_count 증가(원자적) ──────
-- security definer: 서버(service_role) 경로에서만 호출. 신원 정보 없음.
create or replace function public.upsert_question(
  p_source          text,
  p_question_text   text,
  p_normalized_hash text,
  p_grade           smallint,
  p_semester        smallint,
  p_unit            text,
  p_concept         text,
  p_difficulty      smallint,
  p_solution_steps  jsonb,
  p_final_answer    text,
  p_hint            text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.questions (
    source, question_text, normalized_hash, grade, semester, unit, concept,
    difficulty, solution_steps, final_answer, hint, verified, review_status, usage_count
  ) values (
    p_source, p_question_text, p_normalized_hash, p_grade, p_semester, p_unit, p_concept,
    p_difficulty, p_solution_steps, p_final_answer, p_hint, true, 'auto', 1
  )
  on conflict (normalized_hash) do update
    set usage_count = public.questions.usage_count + 1
  returning id into v_id;
  return v_id;
end;
$$;

-- ── Row Level Security ────────────────────────────────────────────────
-- 풀은 신원과 분리된 공유 자산. 쓰기는 service_role(서버)만(정책 없음 → 익명/일반 차단).
-- 읽기는 검증·미격리 문항만 공개(클라이언트 재사용·큐레이션 read 허용).
alter table public.questions enable row level security;

drop policy if exists questions_public_read on public.questions;
create policy questions_public_read on public.questions
  for select
  using (verified = true and review_status <> 'flagged');
