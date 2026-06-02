# SnapMath — Phase 5 개발 노트 (문항 풀 + 확장 기반)

> **목적:** "검산을 통과한 문제·풀이·정답을 신원과 분리된 창고(문항 풀)에 모아 두고, 다시 쓰고, 관리하고, 나중에 독립 서비스로 떼어낼 수 있게" 만든 과정을 비개발자도 이해하도록 정리.
> **한 줄 요약:** 아이가 풀어서 검증된 문제와 AI가 만든 유사 문제를 **이름표 없는 공용 문제 창고**에 차곡차곡 쌓고, 새 문제가 필요하면 창고에서 먼저 꺼내 쓰며, 잘못된 문제는 격리한다.

---

## 0. 무엇이 새로 생겼나 (사용자 눈높이)

1. **문제 창고(문항 풀)가 생겼다.** 검산을 통과한 문제만 들어간다. 누가 올렸는지는 **저장하지 않는다**(개인정보 아님 → 자유롭게 재사용·공유 가능).
2. **같은 문제는 한 번만 쌓인다.** 띄어쓰기·기호 차이를 무시하고 "같은 문제"로 보면, 새로 또 넣지 않고 "사용 횟수"만 1 올린다.
3. **새 문제가 필요하면 창고를 먼저 뒤진다.** "비슷한 문제 한 개 더"를 누를 때, 같은 단원의 검증된 문제가 창고에 있으면 **AI를 부르지 않고** 그걸 꺼내 쓴다(비용↓·속도↑·일관성↑). 없을 때만 새로 만든다.
4. **문제 관리 화면(`/admin/questions`)이 생겼다.** 부모(로그인 계정)가 쌓인 문제를 보고, 검색하고, **승인**하거나 **격리**(잘못/부적절 문제 숨김)할 수 있다. 격리된 문제는 아이에게 다시 나오지 않는다.
5. **푼 문제와 창고가 연결된다.** 아이가 어떤 문제를 풀었는지 학습 기록이 창고의 문제와 연결된다(이름표 없이 문제 번호로만).

---

## 1. 데이터 흐름

```
[사진→판독→풀이→검산 (Phase 1)]
        │  검산 통과(verified=true)
        ▼
[문항 풀: questions]  ← 이름표 없는 공용 창고
   · 정규화 후 해시로 중복 제거 (같은 문제면 usage_count++)
   · source 태깅: 'uploaded'(아이가 올린 문제) / 'generated'(AI 생성 유사문제)

[유사 문제가 필요할 때]
   ① 먼저 창고 조회: 같은 grade·unit·concept·검증·미격리 → 있으면 재사용(reused:true)
   ② 없으면 AI 생성 + 독립 검산 → 통과분 창고에 적재

[관리(/admin/questions)]
   · review_status: 'auto'(자동 적립) | 'approved'(승인) | 'flagged'(격리)
   · flagged·verified=false 는 재사용·공개 읽기에서 제외
```

---

## 2. 핵심 설계 — 왜 이렇게 했나

### 신원 분리 (규칙 6)
`questions` 테이블에는 **부모/아이 식별자 컬럼이 없다.** 문제·풀이·정답·단원만 담는다. 그래서 이 창고는 개인정보가 아니며, 재사용·큐레이션·향후 별도 서비스 분리가 자유롭다. 아이↔문항 연결은 오직 `learning_history.question_id`(문제 번호)로만 이뤄진다.

### 쓰기는 서버만, 읽기는 검증분만 공개
- **쓰기**: `SUPABASE_SERVICE_ROLE_KEY`(서버 전용)로만 적재/상태변경. 일반 사용자·익명은 RLS로 쓰기 차단(정책 없음).
- **읽기**: `verified=true AND review_status<>'flagged'` 문항만 공개(재사용·관리 조회). 검증 안 됐거나 격리된 문제는 노출되지 않는다.

### 중복 제거 & 원자적 사용횟수
`upsert_question` RPC가 `INSERT ... ON CONFLICT(normalized_hash) DO UPDATE SET usage_count = usage_count + 1`을 한 번에 처리한다. 동시에 같은 문제가 들어와도 1건만 유지되고 카운트가 정확히 올라간다.

### 개인정보 가드
적재 전 `containsLikelyPII`로 전화번호·주민번호·이메일·"이름:" 등 패턴을 검사해, 비문제 텍스트가 섞이면 적재를 건너뛴다.

### 모듈 캡슐화 (5-5)
풀 접근 로직은 전부 `src/lib/questionPool/`(`index`·`types`·`normalize`)와 service 클라이언트 `src/lib/supabase/admin.ts`에 모았다. 라우트는 `@/lib/questionPool` 인터페이스로만 접근한다(직접 테이블/RPC 접근 0건). 학습이력·부모계정 도메인과 결합도가 낮아, 나중에 **문항 은행·워크시트 서비스**로 떼어내기 쉽다.

---

## 3. 파일 지도

**새로 생김**
- `supabase/migrations/0002_phase5_question_pool.sql` — questions 테이블, 재사용/리뷰 인덱스, `learning_history.question_id` FK, `upsert_question` RPC, RLS(공개 읽기).
- `src/lib/supabase/admin.ts` — service-role 서버 클라이언트(`server-only`, `isServiceConfigured`).
- `src/lib/questionPool/normalize.ts` — `normalizeQuestionText`·`questionHash`(sha256)·`containsLikelyPII`.
- `src/lib/questionPool/types.ts` — `PoolQuestion`·`UpsertQuestionInput`·`ReuseCriteria`·`CurationFilter` 등.
- `src/lib/questionPool/index.ts` — **유일한 경계**: `upsertVerifiedQuestion`·`findReusableQuestion`·`listQuestions`·`setReviewStatus`·`toSmallint`.
- `src/app/api/questions/route.ts` — 큐레이션 API(GET 목록/검색, PATCH 상태변경, 인증 게이트).
- `src/app/admin/questions/page.tsx` — 관리 뷰(상태 탭·검색·승인/격리 토글).

**수정**
- `src/app/api/solve/route.ts` — 검산 통과 시 주문항/유사문항 적재, `question_id`·`similar_question_id` 반환.
- `src/app/api/similar/route.ts` — 생성 전 풀 우선 조회, 미스 시 생성·적재, `question_id`·`reused` 반환.
- `src/app/api/history/route.ts` · `src/lib/learning/recordLearning.ts` — `question_id` 받아 학습이력에 연결.
- `src/components/challenge/ChallengeSection.tsx` · `src/app/practice/page.tsx` — 현재 유사문항의 풀 id 추적·기록.
- `src/types/database.ts` — `questions` 테이블·`upsert_question` RPC 타입(Row/Insert는 `type` 별칭, interface 금지 — Phase 4 교훈).
- `src/types/analyze.ts` — `SolveResult`에 `question_id`·`similar_question_id` 추가.
- `src/components/layout/AppHeader.tsx` — 계정 드롭다운에 "문항 풀 관리" 링크.

---

## 4. 검증

- `npx tsc --noEmit` ✓ · `npx eslint src --max-warnings=0` ✓ · `npm run build` ✓ (라우트 `/admin/questions`·`/api/questions` 생성 확인).
- dev 스모크: `/admin/questions` 200, `/api/questions` GET/PATCH 401(미인증 차단·graceful).
- 모듈 경계 확인: `questions` 테이블/`upsert_question`/`getServiceSupabase` 직접 사용은 `lib/questionPool`·`lib/supabase/admin`·타입 파일 안에만 존재.

> ⚠️ **사용자 1회 작업 필요**: Supabase SQL Editor에서 `supabase/migrations/0002_phase5_question_pool.sql` 실행. 실행 전엔 적재/재사용/큐레이션이 graceful하게 비활성(null/빈 목록)이고, 나머지 학습 흐름은 정상.

---

## 5. 향후 — 별도 서비스로 떼어내기

`questions`는 신원·학습이력과 분리돼 있고 접근이 `lib/questionPool` 인터페이스로 묶여 있다. 향후 이 모듈을 별도 API/마이크로서비스로 옮기면 **문항 은행 / 유형별 무한 연습 / 워크시트 생성** 같은 독립 제품으로 확장할 수 있다. 메인 앱은 인터페이스만 바꾸면 된다.
