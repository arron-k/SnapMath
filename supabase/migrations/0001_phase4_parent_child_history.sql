-- SnapMath Phase 4 — 부모 계정 + 자녀 프로필 + 학습 이력
-- Supabase SQL Editor에 그대로 붙여넣어 실행하세요.
-- 부모 계정은 Supabase Auth(auth.users)가 관리합니다(이 스크립트는 프로필/이력만 생성).
-- 규칙 6: 식별정보(실명·학교·연락처) 컬럼 없음. 자녀는 별명·학년만. 사진 비저장.

-- ── 자녀 프로필 (부모 소유) ───────────────────────────────────────────
create table if not exists public.child_profiles (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references auth.users(id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 1 and 20),
  grade       smallint check (grade between 4 and 6),
  semester    smallint check (semester between 1 and 2),
  consent_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists child_profiles_parent_idx
  on public.child_profiles (parent_id);

-- ── 학습 이력 (자녀 프로필별 학습 신호) ───────────────────────────────
-- question_id 는 Phase 5(questions 풀) 도입 시 FK로 연결. 지금은 nullable uuid로 둔다.
create table if not exists public.learning_history (
  id               uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  question_id      uuid,
  grade            smallint,
  semester         smallint,
  unit             text,
  concept          text,
  question_text    text,
  is_correct       boolean,
  attempts         smallint,
  time_spent_s     integer,
  created_at       timestamptz not null default now()
);

create index if not exists learning_history_child_idx
  on public.learning_history (child_profile_id, created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────
alter table public.child_profiles  enable row level security;
alter table public.learning_history enable row level security;

-- 부모는 자기 소유(parent_id = auth.uid())의 자녀 프로필만 CRUD
drop policy if exists child_profiles_owner on public.child_profiles;
create policy child_profiles_owner on public.child_profiles
  for all
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

-- 부모는 자기 소유 자녀의 학습 기록만 CRUD (소유 관계는 child_profiles로 확인)
drop policy if exists learning_history_owner on public.learning_history;
create policy learning_history_owner on public.learning_history
  for all
  using (
    exists (
      select 1 from public.child_profiles c
      where c.id = learning_history.child_profile_id
        and c.parent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.child_profiles c
      where c.id = learning_history.child_profile_id
        and c.parent_id = auth.uid()
    )
  );
