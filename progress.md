# SnapMath progress.md

> **For Claude Code:** `plan.md`의 기능 단위 로드맵을 기준으로 진행 상태를 관리합니다.
> 작업 시작 시 `[ ]` → `[▶]`, 완료 시 `[x]`로 갱신하고, 아래 Current Status도 함께 업데이트하십시오.
> 한 기능 단위는 `plan.md`의 **완료 기준**을 충족해야 `[x]`로 인정됩니다.

---

## 🎯 Current Status
- **현재 단계:** ✅ Phase 5 완료(문항 풀 DB·정규화 중복제거·풀 적재·풀 우선 재사용·큐레이션 뷰·모듈 분리) — **MVP 5개 Phase 전부 완료**. ⚠️ 사용자 1회 작업: Supabase SQL Editor에서 `0002_phase5_question_pool.sql` 실행 필요.
- **진행률:** 26 / 26 기능 단위 (100%) + UX 개선(2-R1~2-R4, C-1~C-5, L-1~L-4)
- **모델 모드:** 무료 티어(개발) — **제공자 교차 폴백 체인**(Gemini→Groq). 429(한도)+503(과부하) 자동 전환·재시도. dev 체인: `gemini-flash→gemini-flash-lite→groq:llama-4-scout`(비전 지원). 무료 pro는 한도≈0이라 제외. Groq는 `GROQ_API_KEY` 있을 때만 활성. 유료 전환 시 맨 앞에 gemini-pro 추가.
- **최근 업데이트:** **엔진 개선(도형 풀이 + 검산 안정화)** → 상세: [`docs/엔진개선-도형풀이와검산안정화.md`](docs/엔진개선-도형풀이와검산안정화.md) — ① 풀이/검산 단계에 **원본 이미지 전달**(멀티모달): 그림·도형 문제도 치수를 읽어 풀이(예: 노치형 도형 96−15=81 정상 도출). ② **단위 정규화 강화**(`normalizeAnswer`): `81 제곱센티미터`=`81 cm²`=`81㎠`, 띄어쓴 대분수(`4 1/12`) 오인 방지 — 단위테스트 통과. ③ **꼼꼼한 독립 검산**(`VERIFY_CAREFUL_ONE`) + 1차 불일치 시 1회 재검산(다수결)로 정답이 막히는 false-negative 감소. ④ 생성 유사문항은 **그림 없이 글로만 풀리게** 강제, 풀 재사용은 자기완결적 `generated`만. ⚠️ **검증 한계**: 테스트 당시 Gemini 무료 일일 한도 소진 → 전 호출이 약한 Groq로 폴백되어 라이브 도형 검산 통과율은 한도 리셋/유료 전환 후 재측정 필요. 빌드·tsc·eslint·단위테스트는 통과.
  - 그 전: **Phase 5 완료** — 신원과 분리된 `questions` 문항 풀(service_role 서버 전용 쓰기, RLS는 검증·미격리 공개 읽기). 정규화 해시 중복제거(`upsert_question` RPC, `usage_count++`), 검산 통과분만 source 태깅 적재(solve=uploaded/generated, similar=generated), **풀 우선 조회**로 재고 있으면 모델 호출 없이 재사용, `/admin/questions` 큐레이션(승인/격리/검색), 풀 접근은 `lib/questionPool` 단일 모듈로 캡슐화. `learning_history.question_id` FK 연결까지 마무리. 검증: tsc·eslint(0경고)·build 성공, `/admin/questions` 200, `/api/questions` 401(인증 게이트).

---

## 🔧 Phase 1 · 핵심 엔진 (판독 → 풀이 → 검산)
- [x] 1-1 프로젝트 초기 셋업 (Next.js+TS+Tailwind v4, Zustand, @theme 토큰, .env)
- [x] 1-2 이미지 업로드 + Base64 변환 (미리보기, 형식·용량 검증)
- [x] 1-3 Stage A 판독 API (`/api/analyze`, 문제 추출 + read_confidence, JSON 강제) — 라이브 검증 ✓ (또렷=conf 1, 비수학=is_math_problem false→재촬영)
- [x] 1-4 Stage B 풀이 + 교육과정 매핑 (curriculum_map 주입, 학년 가드) — 라이브 검증 ✓ (각도 문제→4-1 각도 매핑, 학년 범위 설명)
- [x] 1-5 Stage C 검산 + 유사 문항 (독립 재풀이 대조, verified, 정답 검산) — 라이브 검증 ✓ (별도 호출 2회 교차검증, 정상=true / 모호=false, 유사문항 검산)
- [x] 1-6 Raw JSON 출력 + 파이프라인 엔드투엔드 검증 — 라이브 검증 완료(또렷/비수학 판독, verified true/false, 유사문항 검산, 모델 폴백 pro→flash)
- [x] ✅ Phase 1 마스터 브리핑 → 상세: `docs/phase1-개발노트.md`

## 🎨 Phase 2 · 인터랙티브 UI + 수식 렌더링
- [x] 2-1 디자인 시스템 셋업 (Button/Card/Spinner/LoadingDots, 다크모드 시스템감지+토글, 포커스링·48px 터치·sr-only) — `/design` 쇼케이스 검증 ✓
- [x] 2-2 홈 + 대형 촬영/업로드 버튼 + 로딩 인디케이터 + 맥락적 안내 (스냅이 캐릭터, **라이브 카메라**(getUserMedia 모달 `components/camera/CameraCapture.tsx`, 권한거부/비보안컨텍스트 시 파일 폴백), 점3개 로딩, 프라이버시 안내, /api/analyze 연결) ✓
- [x] 2-3 판독 확인 화면 ("이 문제 맞아?" / 재촬영, 저신뢰 needs_retake 분기) ✓
- [x] 2-4 KaTeX 수식 렌더 컴포넌트 (MathText, $…$/$$…$$ 파싱, 다크모드 가독성) — `/design` 검증 ✓
- [x] 2-5 단계별 풀이 타이핑 애니메이션 (1.5s 순차 페이드인, 정답 강조, reduced-motion 즉시표시, verified=false "자신 없음" 안내) ✓
- [x] ✅ Phase 2 마스터 브리핑 → 상세: `docs/phase2-개발노트.md`

### 🔧 Phase 2 UX 개선 (실사용 피드백 반영)
- [x] 2-R1 상태모델(cropping 추가) + 진행 단계바 ProgressStepper (현재 강조·아이콘 이중표시) ✓
- [x] 2-R2 영역 지정 RegionSelect + 클라이언트 크롭 (react-image-crop, 이부분풀기/전체사용/다시고르기) ✓
- [x] 2-R3 흐름 재배선(useAnalyzeFlow: pickImage→cropping, analyzeImage) + page 단계바·AnimatePresence·인라인 로딩, LoadingOverlay 제거 ✓
- [x] 2-R4 검증 — 빌드 성공 + 라이브 브라우저 전 동선 확인. 버그수정: setError(null)→idle 결합 분리, 503 과부하 폴백 추가 ✓
- [x] (인프라) Groq 폴백 추가 — 제공자 추상화(`lib/llm/content·gemini·groq`), MODEL_CHAIN(Gemini→Groq), generateJson 제공자 교차 순회. 라이브 검증: Gemini 소진 시 Groq Scout로 analyze(비전)·solve(verified, 185) 정상 ✓

## 🏆 Phase 3 · 유사 문항 도전 + 정답 루프
- [x] 3-1 도전 섹션 활성화 (풀이 종료 `onAllRevealed` 감지 → ChallengeSection 페이드인, 스냅이 톤) — SolutionView가 풀이+도전 묶음 관리 ✓
- [x] 3-2 유사 문제 렌더 + 답 입력 폼/제출 (similar_question MathText, 대형 입력·제출, 빈값 비활성) ✓
- [x] 3-3 정답 비교 + 정답 시 컨페티 (compareAnswer 정규화: 공백·단위·전각·분수·콤마, canvas-confetti reduced-motion 존중, 색+PartyPopper 아이콘 이중표시) — 정규화 14/14 테스트 ✓
- [x] 3-4 오답 힌트 + 재시도 (hint 노출, "거의 다 왔어!" 보라톤, 정답 직접 노출 금지, 3회+ 시 풀이 다시보기 제안 스크롤) ✓
- [x] ✅ Phase 3 마스터 브리핑 → 상세: `docs/phase3-개발노트.md`

### ✨ Phase 3 도전 흐름 세련화 (실사용 피드백)
- [x] C-1 상태/단계바 확장 — `challengeStatus`(idle/active/solved) store 추가, ProgressStepper **⑤ 도전** 스텝 + active→solved 매핑 ✓
- [x] C-2 풀이 접기 — 도전 시작 시 풀이는 **접힌 요약 카드**(정답 pill+펼쳐보기)로, 도전 카드가 주인공. SolutionSteps `collapsible` 모드 ✓
- [x] C-3 `/api/similar` — "비슷한 문제 한 개 더" 생성+**독립 검산** 라우트(buildSimilarSystemPrompt, VERIFY_ONE, avoid 중복회피). 라이브 검증 ✓(각도 합 180−60−70=50도, 힌트 비노출). Phase 5 풀 우선조회(5-3) 훅
- [x] C-4 도전 카드 재설계 — 자동 포커스·Enter 제출·오답 시 입력칸 흔들림(reduced-motion 존중)·보라 힌트·시도 표시·**비슷한 문제 한 개 더**·정답 후 다음 행동(한 개 더/새 문제). 어수선한 고스트 버튼 제거 ✓
- [x] C-5 페이지 정리 + 검증 — page done 블록 단순화(SolutionView가 done UI 소유), tsc·eslint(0경고)·build 통과 ✓

## 💾 Phase 4 · 부모 계정 + 학습 이력 DB
> 아이는 로그인 안 함. 부모가 가입 → 자녀 프로필 생성 → 아이는 그 프로필로 학습, 부모는 진척 확인.
- [x] 4-1 Supabase 연동 + 스키마 — `@supabase/ssr` 브라우저/서버 클라이언트, `proxy.ts`(세션 갱신), `supabase/migrations/0001_*.sql`(child_profiles·learning_history + RLS owner 정책), Database 타입. 키 미설정 시 "1회성 학습" 모드로 graceful ✓
- [x] 4-2 부모 회원가입/로그인 — `/login`(이메일+비밀번호 탭), AuthProvider(컨텍스트)+useUser, 글로벌 AppHeader(아바타 드롭다운). 로그인 전 Phase 1~3는 미저장 1회성 ✓
- [x] 4-3 자녀 프로필 생성/선택 + 동의 게이트 — `/children`(별명·학년·학기만, T9 "무엇을/왜/언제까지" 안내 + 부모 동의 체크, 동의 전 미저장), 프로필 스위처, childStore(활성 프로필 localStorage) ✓
- [x] 4-4 학습 결과 저장 — `/api/history`(쿠키 인증+RLS) INSERT, ChallengeSection이 정답/오답-이탈 시 기록(단원·정답여부·시도·시간), 사진 미저장. recordLearning은 실패해도 학습 흐름 비차단 ✓
- [x] 4-5 부모 대시보드 `/history` — 자녀 스위처, 정답률·푼 문제·학습일 통계, 오답 노트(단원별 + `/practice` 단원 재도전), 최근 학습 리스트. 다크모드·접근성(색+아이콘 이중표시·aria) ✓
- [x] ✅ Phase 4 마스터 브리핑 → 상세: `docs/phase4-개발노트.md`
> ⚠️ **사용자 1회 작업 필요**: Supabase SQL Editor에서 `supabase/migrations/0001_phase4_parent_child_history.sql` 실행(테이블+RLS 생성). 실행 전엔 로그인/저장만 비활성, 나머지 학습은 정상. → **실행 완료 확인됨(테이블 존재)**.

### ✨ Phase 4 학습자 선택 UX 개편 (실사용 피드백 · L-1~L-3)
> "메인에서 지금 누가 학습 중인지 안 보이고, 자녀 N명 중 선택 동선이 없다"는 피드백 반영.
- [x] L-1 활성 학습자 전역화 — `ChildrenProvider`(컨텍스트)로 프로필을 1회 로드해 헤더·홈·챌린지가 공유. `useChildren`는 컨텍스트 얇은 래퍼로 축소(`/children`·`/history` API 동일) ✓
- [x] L-2 상시 표시 + 전환 — 헤더 `LearnerChip`("○○ 학습 중", 모든 단계 노출) + 홈 `LearnerBanner` + 공유 `LearnerSwitcher`(큰 아바타 시트, Esc·48px·색+체크 이중표시). 전환 시 칩·홈·저장 자녀 동기화 ✓
- [x] L-3 자녀 0명 등록 유도 — 로그인+자녀 0명일 때 헤더 CTA·홈 넛지 노출. ✓
- [x] L-4 회원가입 필수 게이트(정책 변경) — **사진 찍기/올리기 시작 시 게이트**: 미로그인 → `/login?mode=signup&next=/`(회원가입 탭)로 자연 진입, 로그인+자녀 0명 → `/children`로 유도. `useStartGuard` 훅 + `UploadButtons` canStart. 홈 배너에 게스트용 "회원가입하고 시작하기" 카드 추가. `/login`은 `next`·`mode` 쿼리 지원(인증 후 원위치 복귀). Supabase 미설정 시에만 게이트 우회(dev 폴백). ✓
  > ⚠️ 이전의 "미로그인 1회성 학습 허용" 원칙은 사용자 요청으로 **회원가입 필수**로 변경됨(plan.md 4-2 설명과 상충 — 의도된 변경).
- 검증: tsc·eslint(0)·build 통과, `/`·`/login`·`/login?mode=signup`·`/children` 200, 런타임 에러 없음. 풀 클릭 동선은 부모 로그인 후 육안 확인 권장.

## 🗂 Phase 5 · 문항 풀(DB) + 별도 서비스 확장 기반
> 업로드/생성 문항을 신원과 분리된 풀에 적립 → 재사용·큐레이션 → 독립 서비스 분리 토대.
- [x] 5-1 문항 풀 스키마 + 정규화/중복 제거 — `0002_phase5_question_pool.sql`(questions + RLS 공개읽기 + `upsert_question` RPC + `learning_history.question_id` FK), `lib/questionPool/normalize.ts`(NFKC·기호제거 정규화, sha256 해시, PII 가드), Database 타입에 questions·RPC 추가 ✓
- [x] 5-2 파이프라인 → 풀 적재 — `/api/solve`가 검산 통과 시 주문항(source='uploaded')·유사문항(='generated') upsert, `/api/similar` 생성·검산분(='generated') upsert. PII 가드 통과분만, 중복은 `usage_count++`. 비차단(실패해도 학습 흐름 유지) ✓
- [x] 5-3 풀 우선 조회(재사용) — `/api/similar`가 생성 전 `findReusableQuestion`으로 같은 grade·unit·concept·검증·미격리 문항 조회, 히트 시 모델 호출 없이 재사용(`reused:true`), `usage_count` 낮은 것 우선·avoid 중복 회피 ✓
- [x] 5-4 큐레이션/관리 뷰 — `/admin/questions`(상태 탭 전체/자동/승인/격리 + 검색 + 승인·격리·해제 토글), `/api/questions`(GET 목록·검색, PATCH 상태변경, 부모 로그인 인증 게이트). `review_status='flagged'`·`verified=false`는 재사용·공개 읽기에서 제외 ✓
- [x] 5-5 풀 모듈 분리 — 모든 풀 접근을 `lib/questionPool`(index/types/normalize) + service-role `lib/supabase/admin.ts`로 캡슐화. 라우트는 `@/lib/questionPool` 인터페이스로만 접근(직접 테이블/RPC 접근 0건 확인). 학습이력/부모계정 도메인과 결합 낮음 ✓
- [x] ✅ Phase 5 마스터 브리핑 → 상세: `docs/phase5-개발노트.md`
> ⚠️ **사용자 1회 작업 필요**: Supabase SQL Editor에서 `supabase/migrations/0002_phase5_question_pool.sql` 실행(questions 테이블·RPC·FK·RLS 생성). 실행 전엔 풀 적재/재사용/큐레이션만 비활성(graceful null), 나머지 학습은 정상.

---

## 📌 전환 체크포인트 (놓치면 안 되는 것)
- [ ] 실제 학생 데이터 투입 전 → **Gemini 유료 Tier 1 / Vertex AI로 전환** (학습 미사용)
- [▶] 저장 기능 출시 전 → **부모 계정 + 자녀 프로필 동의 게이트**(Phase 4 완료) + **개인정보처리방침**(미작성, 출시 전 추가 필요)
- [ ] 베타 전 → 4학년 커리큘럼 기준 말투·풀이 수준·UI 직관성 튜닝 루프
- [x] 별도 서비스 분리 검토 시 → 문항 풀(questions)이 신원·학습이력과 결합도 낮게 유지됐는지 확인 — Phase 5에서 `lib/questionPool` 단일 인터페이스로 캡슐화, 신원 컬럼 없음(연결은 `learning_history.question_id`만). 분리 준비 완료
- [ ] Stage A 판독 방식 재검토(비용·스케일·프라이버시·수식정확도 트리거) → **OCR 대안 검토 노트: `docs/ocr-검토노트.md`** (현재는 LLM 유지)
