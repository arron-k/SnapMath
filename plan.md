# SnapMath plan.md

> 이 문서는 SnapMath의 최종 목표·아키텍처·기능 단위·완료 기준을 정의합니다.
> 개발 규칙과 단계별 프롬프트는 `claude.md`, 진행 상태는 `progress.md`를 따릅니다.
> **작업 지침:** `7. 기능 단위 로드맵`을 번호 순서대로 진행하고, 한 단위가 끝날 때마다 `progress.md`를 업데이트하십시오.

---

## 1. 프로젝트 개요

* **제품명:** SnapMath
* **한 줄 정의:** 초등 4~6학년 학생이 수학 문제를 사진으로 찍으면, 또래 친구 같은 AI가 단계별로 풀어주고 직접 풀어볼 유사 문제까지 내주는 학습 도우미.
* **타겟:** 초등학교 고학년(4~6학년)
* **북극성(최우선 가치):** **풀이 정확도 · 교육 품질.** 한 번의 "자신 있는 오답"이 신뢰를 무너뜨린다. 친근함·재미는 정확성을 해치지 않는 선에서만 더한다.
* **베타 전략:** 개발 직후 실제 4학년 학생으로 테스트. 4학년 커리큘럼(각도, 곱셈과 나눗셈 등) 기준으로 AI 말투·풀이 수준·UI 직관성을 즉시 튜닝.
* **확장 비전:** 업로드 문항 + AI 생성 문항을 **신원과 분리된 문항 풀(문항 DB)**에 검산 통과분만 적립한다. 이 풀은 ① 재사용 캐시(비용↓·일관성↑) ② 큐레이션 가능한 학습 자산 ③ 향후 **별도 서비스(문항 은행·워크시트·유형별 무한 연습 등)로 분리**할 수 있는 토대가 된다. (Phase 5)

### 차별점
1. **틀리면 차라리 모른다고 말한다** — 판독 신뢰도 낮으면 재촬영, 검산 실패면 솔직히 인정.
2. **검산을 통과한 답만 노출** — 풀이(B) → 독립 검산(C) 일치 시에만 표시.
3. **교육과정에 맞춘 설명** — 단원·개념 매핑, 학년 초과 개념 금지.
4. **쌓일수록 강해지는 문항 풀** — 풀이·검산된 문항이 누적되어 재사용·확장 가능한 자산이 된다.

---

## 2. 타겟 사용자 & 사용 맥락

* **주 사용자:** 초등 4~6학년 (혼자 또는 부모 옆에서)
* **사용 상황:** 숙제하다 막힘 / 채점 후 틀린 문제 이해 / 비슷한 유형 더 연습
* **핵심 요구:** (학생) "답만이 아니라 왜 그런지 친구처럼 쉽게" · (부모) "엉뚱한 답 알려주는 거 아니지?" ← **이 신뢰가 제품의 생사.**
* **제약:** 모바일 우선. 손글씨·인쇄·삐뚤어진 사진까지 들어옴.

---

## 3. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js (App Router) · React 19 | |
| 언어 | TypeScript | `any` 금지 |
| 스타일 | Tailwind v4 (`@theme`) · Lucide React · framer-motion | 모바일 우선, 다크모드 |
| 상태관리 | Zustand | analyzeStore 중심 |
| **AI (개발/베타)** | Gemini 2.5 Flash **무료 티어** | 카드 불필요. 데이터가 학습에 쓰일 수 있음 → 내 테스트 데이터에만 |
| **AI (실서비스)** | Gemini 2.5 Flash **유료 Tier 1 / Vertex AI** | 학생 데이터 학습 미사용 보장. 품질 동일, 처리량·프라이버시 차이 |
| 수식 | KaTeX | |
| 축하 효과 | canvas-confetti | |
| DB/인증 | Supabase (PostgreSQL, RLS) + Supabase Auth | 부모 계정 + 자녀 프로필, 학습 이력·오답 노트 |

> **모델 전략:** 무료 티어로 개발·내 손 베타까지(비용 0, 요청 제한 분당 약 5~15회). **실제 학생이 자기 숙제를 올리는 순간 = 유료 전환 시점.** Flash는 유료라도 토큰 단가가 낮고 월 고정비 없음.
> **모델 폴백 체인(제공자 교차):** 단일 모델 고정 대신 성능순 체인을 시도하고 일시적 오류 시 다음 모델로 자동 전환한다. **여러 제공자를 넘나든다** — 기본 Gemini(`flash → flash-lite`, 유료 시 맨 앞 `pro`) 소진 시 **Groq**(`llama-4-scout`, 비전 지원, 무료·고속)로 폴백. **429(한도)·503(과부하/UNAVAILABLE) 모두** 폴백·재시도 대상(마지막 모델 지수 백오프). 체인은 `GEMINI_MODELS`+`GROQ_MODELS`(+`GROQ_API_KEY` 있을 때만 Groq 활성) 환경변수로 구성. 제공자 어댑터는 OpenAI 호환 방식으로 추상화. 구현: `lib/constants.ts`(MODEL_CHAIN), `lib/llm/{content,gemini,groq}.ts`, `lib/utils/generateWithRetry.ts`.

---

## 4. 핵심 아키텍처 & 데이터 파이프라인

정확도를 위해 **3단계로 분리**한다(한 번에 풀지 않는다).

```
[Client] 사진 촬영(라이브 카메라)/업로드 → (선택) 문제 영역 사각형 지정 → 클라이언트 크롭 → Base64
   │  촬영은 getUserMedia 라이브 카메라(PC·모바일). 권한 거부/미지원/비보안컨텍스트 시 파일 선택 폴백.
   │  영역 지정은 선택사항("전체 사용" 가능). 지정 시 해당 영역만 전송(정확도↑·토큰↓·프라이버시↑)
   ▼
[Stage A · 판독]  이미지 → 문제 텍스트 + read_confidence
   │  낮으면: "사진이 잘 안 보여요, 다시 찍어줄래?" (재촬영)
   │  높으면: 추출 문제를 보여주고 "이 문제 맞아?" 확인 (1탭)
   ▼
[Stage B · 풀이]  확인된 문제 → 단계별 풀이 + final_answer + 교육과정 매핑
   ▼
[Stage C · 검산]  독립적으로 다시 풀어 B의 답과 대조
   │  일치(verified=true): 노출 + 문항 풀에 적재(source='uploaded')
   │  불일치(false): "자신이 없어, 선생님께 물어보자" 솔직 응답
   ▼
[유사 문항]  ① 문항 풀에서 같은 단원·개념·난이도 매칭 검색 → 있으면 재사용
            ② 없으면 생성 + 정답 독립 검산 → 풀에 적재(source='generated')
   ▼
[Client] 단계별 타이핑 → KaTeX 렌더 → 유사 문항 도전
```

#### 문항 풀 (Question Pool) — 신원과 분리된 학습 자산
```
[문항 풀: questions 테이블]  ← 업로드/생성 문항 중 검산 통과분만 적립 (정규화·중복제거)
   │   읽기: 유사 문항 생성 전 재사용 → 모델 호출↓, 일관성↑
   │   쓰기: source 태깅(uploaded/generated), usage_count 증가
   │   분리: 아이 신원과 무관(개인정보 아님). learning_history만 question_id로 연결
   └─► (확장) 독립 모듈/내부 API로 분리 → 별도 서비스(문항 은행 등) 토대
```

* **판독 확인(A)이 정확도 1등 공신** — 사진 앱 오답 대부분은 "문제를 잘못 읽어서". 풀기 전 1회 확인이 차단.
* **유사 문항 정답도 독립 검산 후 생성** — 정답 비교가 환각이 아닌 검증된 값과 이뤄지게.
* **문항 풀은 아이 신원과 분리** — 풀에는 문제·풀이·정답만 담고 누가 올렸는지는 담지 않는다(개인정보 아님). 덕분에 재사용·공유·확장이 자유롭고, 프라이버시 경계가 단순해진다.
* **모든 LLM 호출은 서버(API 라우트)에서.** API 키 클라이언트 노출 금지.

---

## 5. AI 응답 JSON 스키마

모델은 **반드시 이 JSON으로만** 응답(시스템 프롬프트로 강제, 파싱 실패 시 1회 재시도 + 폴백).

```jsonc
{
  "read_confidence": 0.0,          // Stage A 판독 신뢰도 0~1
  "extracted_question": "string",  // 사진에서 읽은 문제 원문 (확인용)
  "is_math_problem": true,
  "curriculum": { "grade": "4", "semester": "1", "unit": "각도", "concept": "각도의 합과 차" },
  "step_by_step_solution": ["먼저 주어진 각을 확인해 보자.", "..."],
  "final_answer": "string",
  "verified": true,                // Stage C 검산 통과 여부
  "similar_question": {
    "question": "string",
    "correct_answer": "string",    // 독립 검산된 정답
    "hint": "string"               // 오답 시 힌트 (정답 직접 노출 X)
  }
}
```
> 클라이언트는 `verified=false` 또는 `read_confidence < 임계값`이면 풀이를 노출하지 않고 재촬영/안내 플로우로 보낸다.

---

## 6. 교육과정 매핑 (curriculum_map)

학년·학기·단원을 설정 데이터로 관리하고 Stage B 프롬프트에 주입("이 단원에서 배우는 방법으로만 설명"). 검정교과서 도입으로 출판사별 단원명·순서가 일부 다를 수 있어 **개념 단위 매핑** 권장.

| 학년 | 학기 | 단원 |
|---|---|---|
| 4 | 1 | 큰 수 · 각도 · 곱셈과 나눗셈 · 평면도형의 이동 · 막대그래프 · 규칙 찾기 |
| 4 | 2 | 분수의 덧셈과 뺄셈 · 삼각형 · 소수의 덧셈과 뺄셈 · 사각형 · 꺾은선그래프 · 다각형 |
| 5 | 1 | 자연수의 혼합 계산 · 약수와 배수 · 규칙과 대응 · 약분과 통분 · 분수의 덧셈과 뺄셈 · 다각형의 둘레와 넓이 |
| 5 | 2 | 수의 범위와 어림하기 · 분수의 곱셈 · 합동과 대칭 · 소수의 곱셈 · 직육면체 · 평균과 가능성 |
| 6 | 1 | 분수의 나눗셈 · 각기둥과 각뿔 · 소수의 나눗셈 · 비와 비율 · 여러 가지 그래프 · 직육면체의 부피와 겉넓이 |
| 6 | 2 | 분수의 나눗셈 · 소수의 나눗셈 · 공간과 입체 · 비례식과 비례배분 · 원의 넓이 · 원기둥, 원뿔, 구 |

```jsonc
// curriculum_map.json
{
  "4-1": ["큰 수","각도","곱셈과 나눗셈","평면도형의 이동","막대그래프","규칙 찾기"],
  "4-2": ["분수의 덧셈과 뺄셈","삼각형","소수의 덧셈과 뺄셈","사각형","꺾은선그래프","다각형"],
  "5-1": ["자연수의 혼합 계산","약수와 배수","규칙과 대응","약분과 통분","분수의 덧셈과 뺄셈","다각형의 둘레와 넓이"],
  "5-2": ["수의 범위와 어림하기","분수의 곱셈","합동과 대칭","소수의 곱셈","직육면체","평균과 가능성"],
  "6-1": ["분수의 나눗셈","각기둥과 각뿔","소수의 나눗셈","비와 비율","여러 가지 그래프","직육면체의 부피와 겉넓이"],
  "6-2": ["분수의 나눗셈","소수의 나눗셈","공간과 입체","비례식과 비례배분","원의 넓이","원기둥, 원뿔, 구"]
}
```

**설명 루브릭:** ① 무엇을 구하는지 ② 어떤 개념을 쓰는지 ③ 한 단계씩 왜. 한 단계당 한 가지 생각.
**금지:** 학년 초과 개념(예: 4학년에게 방정식/미지수 x).

---

## 7. 기능 단위 로드맵 (번호 + 완료 기준)

> `claude.md`의 프롬프트 세트와 1:1 매핑. 번호 순서를 엄격히 따른다.

### Phase 1 · 핵심 엔진 (판독 → 풀이 → 검산)
| # | 기능 | 완료 기준 |
|---|---|---|
| 1-1 | 프로젝트 초기 셋업 | `npm run dev` → localhost:3000 에러 없이 렌더 |
| 1-2 | 이미지 업로드 + Base64 | 이미지 선택 → 썸네일 + Base64 길이 출력 |
| 1-3 | Stage A 판독 API | 사진 → extracted_question + read_confidence JSON, 흐릿한 사진은 낮은 confidence |
| 1-4 | Stage B 풀이 + 교육과정 매핑 | 학년 수준 단계별 풀이 + curriculum 매핑 |
| 1-5 | Stage C 검산 + 유사 문항 | 정상 문제 verified=true + 검증된 유사문항, 모호 입력 시 false 경로 |
| 1-6 | Raw JSON 출력 + 파이프라인 검증 | 전체 JSON + verified/confidence 정상, 분기 동작 확인 |

### Phase 2 · 인터랙티브 UI + 수식 렌더링
| # | 기능 | 완료 기준 |
|---|---|---|
| 2-1 | 디자인 시스템 셋업 | 버튼/카드/로딩/다크모드 토글 정상 |
| 2-2 | 홈 + 촬영/업로드 + 로딩 | 홈 → 사진 선택 → 로딩 → API 연결. 촬영은 `getUserMedia` 라이브 카메라 모달(`components/camera/CameraCapture.tsx`), 권한거부/비보안컨텍스트 시 파일 폴백 |
| 2-3 | 판독 확인 화면 | 추출 문제 확인 → 확인 시 풀이, 재촬영 시 복귀 |
| 2-4 | KaTeX 수식 렌더 | 분수·소수·각도 포함 풀이 깨짐 없이 렌더 |
| 2-5 | 단계별 풀이 타이핑 | 검증 풀이 한 줄씩 노출 + 수식, verified=false 시 안내 |

> **Phase 2 UX 개선(실사용 피드백, 2-R1~2-R4):** ①문제 영역 사각형 지정(선택, 클라이언트 크롭) ②상단 진행 단계바(사진→영역→확인→풀이)+인라인 로딩(전체화면 오버레이 제거). 상세: `docs/phase2-개발노트.md`.

### Phase 3 · 유사 문항 도전 + 정답 루프
| # | 기능 | 완료 기준 |
|---|---|---|
| 3-1 ✅ | 도전 섹션 활성화 | 풀이 종료 후 "내가 풀어보기" 자동 등장 — `SolutionView`가 `onAllRevealed`로 `ChallengeSection` 페이드인 |
| 3-2 ✅ | 유사 문제 + 답 입력 폼 | 유사 문제 MathText 렌더 + 답 입력/제출(빈값 비활성) |
| 3-3 ✅ | 정답 비교 + 컨페티 | `compareAnswer`(공백·단위·전각·분수·콤마 정규화) → canvas-confetti + 색+아이콘 이중표시. 정규화 14/14 테스트 |
| 3-4 ✅ | 오답 힌트 + 재시도 | 오답 → hint + 보라톤 격려, 정답 직접 노출 안 함, 3회+ 시 풀이 다시보기 |

> Phase 3 구현: `lib/utils/{compareAnswer,celebrate}.ts`, `components/challenge/ChallengeSection.tsx`, `components/solution/SolutionView.tsx`. verified=true 풀이에만 도전 노출. 상세: `docs/phase3-개발노트.md`.
> **도전 흐름 세련화(C-1~C-5):** 도전 시작 시 풀이는 접힌 요약 카드로 줄고 도전 카드가 주인공(`challengeStatus` store, 단계바 ⑤ 도전). 오답 시·추가연습용 **"비슷한 문제 한 개 더"** = `POST /api/similar`(생성 + 독립 검산, `avoid` 중복회피). ⚠️ 이 라우트는 매번 모델 생성 → **Phase 5-3(풀 우선 조회)에서 풀 재사용 후 미스 시에만 생성**으로 교체할 훅.

### Phase 4 · 부모 계정 + 학습 이력 DB
> 아이는 로그인하지 않음. 부모가 가입·로그인 후 자녀 프로필을 만들면 아이는 그 프로필로 학습, 부모는 진척을 본다.

| # | 기능 | 완료 기준 |
|---|---|---|
| 4-1 ✅ | Supabase 연동 + 스키마(RLS) | child_profiles·learning_history 생성, 타 부모 데이터 접근 차단 — @supabase/ssr 클라이언트·proxy.ts·migrations SQL·RLS owner 정책 |
| 4-2 ✅ | 부모 회원가입/로그인 + 동의 | 부모 가입→로그인→재로그인 동작 — /login·AuthProvider·AppHeader. ⚠️ "로그인 전 1회성 학습"은 L-4에서 **회원가입 필수**로 변경됨 |
| 4-3 ✅ | 자녀 프로필 생성/선택 + 동의 게이트 | 프로필 생성(동의 포함)→선택→이후 학습이 프로필에 연결 — /children·childStore·T9 안내 |
| 4-4 ✅ | 학습 결과 저장(최소 수집) | 도전 완료→활성 프로필에 학습 신호 저장, 사진 미저장 — /api/history(RLS)·recordLearning |
| 4-5 ✅ | 부모 대시보드 /history | 부모가 자녀별 기록·오답·정답률 추이 확인 — 통계·오답노트·/practice 재도전 |

> **학습자 선택 UX 개편(L-1~L-3):** 활성 학습자를 `ChildrenProvider`로 전역화 → 헤더 `LearnerChip`(모든 화면 "○○ 학습 중") + 홈 `LearnerBanner` + 공유 `LearnerSwitcher`(큰 아바타 시트). 전환 즉시 저장 자녀 동기화.
> **회원가입 필수 게이트(L-4 · 정책 변경):** 사진 찍기/올리기 시작 시 `useStartGuard` — 미로그인→`/login?mode=signup&next=/`, 로그인+자녀0→`/children`로 자연 유도. 게스트 홈에 회원가입 카드. **위 4-2의 "1회성 학습"은 더 이상 적용 안 됨**(Supabase 미설정 dev 환경만 우회). 상세: `docs/phase4-개발노트.md` 5-bis·5-ter.

### Phase 5 · 문항 풀(DB) & 별도 서비스 확장 기반
> 업로드/생성 문항을 신원과 분리된 풀에 적립해 재사용·큐레이션하고, 나중에 독립 서비스로 분리할 수 있는 토대를 만든다.

| # | 기능 | 완료 기준 |
|---|---|---|
| 5-1 | 문항 풀 스키마 + 정규화/중복 제거 | questions 테이블 생성, 정규화 해시로 동일 문항 1건 유지 |
| 5-2 | 파이프라인 → 풀 적재 | 검산 통과 문항(업로드/생성)이 source 태깅되어 풀에 INSERT/upsert |
| 5-3 | 풀 우선 조회(재사용) | 유사 문항 생성 전 풀에서 매칭 시 재사용, 미스 시에만 생성 |
| 5-4 | 큐레이션/관리 뷰 | review_status(자동/승인/신고) 관리, 부적절·오류 문항 격리 |
| 5-5 | 풀 모듈 분리(확장 토대) | 풀 접근을 내부 API/모듈로 캡슐화 → 향후 별도 서비스로 분리 가능 |

---

## 8. 데이터 설계 & 아동 데이터 원칙 (Privacy by Design)

타겟이 미성년자라 "많이 저장"이 곧 위험. **학습 신호는 풍부하게, 개인 식별정보는 최소로** 분리한다. 아이는 직접 가입하지 않고, **부모 계정 아래 자녀 프로필**로 학습한다.

```sql
-- 부모 계정은 Supabase Auth(auth.users)로 관리

create table child_profiles (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references auth.users(id),  -- 부모 소유
  nickname    text not null,         -- 별명 (실명 권장 안 함)
  grade       smallint,              -- 4~6
  semester    smallint,              -- 1~2
  consent_at  timestamptz,           -- 법정대리인 동의 시각
  created_at  timestamptz default now()
);

create table learning_history (
  id               uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references child_profiles(id),
  question_id      uuid references questions(id),  -- 문항 풀 연결 (어떤 문항을 풀었나)
  grade            smallint,
  semester         smallint,
  unit             text,             -- 단원 (curriculum_map)
  concept          text,
  question_text    text,             -- 추출된 문제 텍스트 (원본 사진 대신)
  is_correct       boolean,
  attempts         smallint,
  time_spent_s     integer,
  created_at       timestamptz default now()
);
-- RLS: 부모는 자기 소유(parent_id = auth.uid())의 자녀 프로필과 그 학습 기록만 접근
```

### 문항 풀 (Question Pool) — 신원과 분리된 공유 자산

업로드·생성 문항 중 **검산 통과분만** 적립한다. 문제·풀이·정답만 담고 **누가 올렸는지는 담지 않는다**(개인정보 아님 → 재사용·공유·확장 자유). 아이↔문항 연결은 `learning_history.question_id`로만 이뤄진다.

```sql
create table questions (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,           -- 'uploaded' | 'generated'
  question_text   text not null,           -- 문제 원문 (개인정보·이름 등은 제외하고 문제만)
  normalized_hash text unique,             -- 정규화 후 해시 (중복 제거)
  grade           smallint,
  semester        smallint,
  unit            text,
  concept         text,
  difficulty      smallint,                -- 1~5 (선택)
  solution_steps  jsonb,                   -- 단계별 풀이
  final_answer    text,
  hint            text,
  verified        boolean default false,   -- 검산 통과분만 활성
  review_status   text default 'auto',     -- 'auto' | 'approved' | 'flagged' (큐레이션)
  usage_count     integer default 0,
  created_at      timestamptz default now()
);
```
* **적재 규칙**: `verified=true`인 문항만. 업로드/생성 여부를 `source`로 태깅.
* **중복 제거**: 공백·기호 정규화 후 `normalized_hash`로 동일 문항 1건 유지, 재등장 시 `usage_count` 증가.
* **재사용**: 유사 문항 생성 전 같은 `unit·concept·difficulty`의 검증된 문항을 풀에서 우선 조회 → 모델 호출 절감 + 출제 일관성.
* **개인정보 차단**: 사진 속 이름 등 비문제 텍스트는 저장 금지(문제만). 원본 사진은 풀에도 저장하지 않음.
* **확장 토대**: 풀 접근을 내부 모듈/API(`lib/questionPool` 또는 `/api/questions`)로 캡슐화해, 향후 문항 은행·워크시트 등 **독립 서비스로 분리** 가능하게 둔다.

### 아동 데이터 원칙 (요약)
* **부모 계정 모델**: 부모(성인)가 가입 → 자녀 프로필(별명·학년) 생성 → 아이가 그 프로필로 학습. 자녀 자격증명 미수집.
* **최소 수집**: 학습에 쓰이는 신호만. 실명·학교·연락처 미수집(별명 사용).
* **사진 비저장 기본값**: 텍스트 추출 후 폐기. 저장 시 짧은 보관기간 + 비공개 권한 + 삭제 기능.
* **법정대리인 동의**: 자녀 프로필 생성 시점에 부모 동의(`consent_at`). 동의 전 학습 기록 미저장.
* **맥락적 고지**: 무엇을 왜 언제까지 모으는지 쉬운 말로 화면에서 설명.

---

## 9. 성공 지표 & 리스크

### 지표
* 판독 정확도(확인 통과율) / 풀이 정답률(검산 통과율, 목표 초등 범위 99%+) / 도전 정답 도달률 / 재방문·연속 학습일
* 문항 풀: 누적 문항 수 / 단원별 커버리지 / **재사용률**(생성 대신 풀 재사용 비율 = 비용 절감 지표)

### 리스크 & 대응
| 리스크 | 대응 |
|---|---|
| 사진 오판독 | Stage A 판독 확인 + 신뢰도 임계값 |
| 자신 있는 오답 | Stage C 독립 검산, 불일치 시 솔직 응답 |
| 유사 문항 정답 환각 | 정답 독립 검산 후 생성 |
| 학년 초과 설명 | 교육과정 그라운딩 + 프롬프트 가드 |
| 무료 티어로 학생 데이터 학습 노출 | 실사용 시작 시 유료 Tier 1/Vertex AI 전환 |
| 무료 티어 요청 제한(429)·모델 과부하(503) | 제공자 교차 폴백 체인(Gemini→Groq) 자동 전환 + 마지막 모델 지수 백오프 + "잠시 후 다시" 안내 |
| 사진에 문제 여러 개·잡텍스트 혼입 | 클라이언트 영역 지정(사각형 크롭)으로 한 문제만 전송 |
| 아동 개인정보 | 최소 수집·가명화·사진 비저장·부모 동의 |
| 문항 풀에 오류·부적절 문항 적립 | 검산 통과분만 적재 + review_status 큐레이션(신고·격리), 문항 텍스트만(사진/이름 제외) |
| API 키 노출 | 모든 LLM 호출 서버에서만 |
