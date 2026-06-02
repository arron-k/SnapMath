# SnapMath — 이미지→문항 텍스트 변환(OCR/판독) 검토 노트

> **목적:** Stage A(사진 → 문제 텍스트)를 무엇으로 처리할지에 대한 **의사결정 기록 + 후보 비교 + 향후 실험 메모**.
> **성격:** 살아있는 문서(living doc). 새로 알게 된 내용·실험 결과를 아래 "갱신 로그"와 각 표에 계속 덧붙인다.
> **현재 결론(2026-06-01):** **멀티모달 LLM(Gemini→Groq 폴백) 유지.** OCR 전환은 비용·스케일·프라이버시 필요 시점에 재검토.

---

## 0. 갱신 로그 (최신이 위로)

| 날짜 | 변경/결정 | 메모 |
|---|---|---|
| 2026-06-01 | 문서 생성. 현 구성(LLM) 유지 결정 | Groq 무료 폴백으로 비용·한도 부담 완화되어 OCR 전환 시급성 낮음 |

> ✍️ 새 항목 추가 양식: `| YYYY-MM-DD | 무엇을 결정/실험했나 | 근거·수치 |`

---

## 1. 현재 구성 (As-Is)

- **방식:** 멀티모달 LLM이 이미지에서 직접 `extracted_question`·`read_confidence`·`is_math_problem`을 뽑음 (Stage A).
- **체인:** Gemini(`flash → flash-lite`) → Groq(`llama-4-scout`, 비전) — 제공자 교차 폴백.
- **관련 코드:** `src/app/api/analyze/route.ts`, `src/lib/llm/{content,gemini,groq}.ts`, `src/lib/gemini/prompts.ts`(ANALYZE_SYSTEM_PROMPT).
- **안전망:** "이 문제 맞아?" 확인 화면(2-3)이 판독 오류를 사용자 1탭으로 교정 + `read_confidence` 임계값(0.6) 미만이면 재촬영.

### 왜 지금은 LLM이 유리한가
Stage A 입력은 **한국어 문장 + 수식 + (손글씨/인쇄) + 사진 왜곡**이 한 장에 섞임. 순수 OCR은 이를 따로 처리해야 하고 수식·손글씨·레이아웃에서 약함 → 도구를 여러 개 이어 붙여도 LLM보다 정확도가 낮기 쉬움. 정확도가 북극성이라 현 단계엔 LLM이 가장 단순·강력.

---

## 2. 후보 비교

> 표기: ★최강 / ✅양호 / △제한적 / ✕없음. 실제로 테스트하면 결과를 "검증" 칸에 적는다.

| 종류 | 후보 | 한국어 | 수식 | 손글씨 | 비용/형태 | 검증 |
|---|---|---|---|---|---|---|
| 수식 특화 API | **Mathpix** | △ | ★ (LaTeX) | ✅ | 상용 API, 소량 무료 | 미검증 |
| OSS 수식 OCR | `pix2tex`(LaTeX-OCR) | ✕ | ★ | △ | 무료·자체호스팅 | 미검증 |
| OSS 수식+문서 | `texify`(VikParuchuri) | △ | ★ | △ | 무료·자체호스팅 | 미검증 |
| OSS 종합 OCR | **PaddleOCR** (PP-Structure + PP-FormulaNet) | ✅ | ✅ | △ | 무료·자체호스팅 | 미검증 |
| OSS 종합 OCR | **Surya** (VikParuchuri) | ✅ | ✕ | △ | 무료·자체호스팅·레이아웃 우수 | 미검증 |
| OSS VLM-OCR | **GOT-OCR2.0**, olmOCR | ✅ | ✅ | ✅ | 무료·**GPU 필요** | 미검증 |
| 한국어 클라우드 | **Naver CLOVA OCR**, **Upstage Document AI** | ★ | △ | ✅ | 무료 크레딧 후 과금 | 미검증 |
| 범용 클라우드 | Google Vision, Azure AI Vision Read | ✅ | ✕ | ✅ | 무료 한도 후 과금 | 미검증 |
| (현재) 멀티모달 LLM | **Gemini / Groq(llama-4-scout)** | ✅ | ✅ | ✅ | 무료 티어·한도 있음 | ✅ 라이브 검증(현 구성) |

### 한 줄 평
- **Mathpix**: 수식 정확도가 필요해지는 5~6학년(분수·도형) 확장 시 1순위 보강.
- **PaddleOCR / GOT-OCR2**: 비용 0·온프레미스. 사진이 서버 밖으로 안 나가 **아동 데이터 보호에 유리**. 단 운영(GPU/서버) 부담.
- **CLOVA / Upstage**: 한국어 인쇄 텍스트 정확도 최상급(국내 서비스). 수식은 약함.
- **순수 텍스트 OCR(Surya/Vision)**: 문장제·인쇄엔 좋지만 수식 깨짐 → 단독 사용은 비권장.

---

## 3. 전환 트리거 (언제 OCR을 진지하게 볼까)

아래 중 하나라도 강해지면 재검토:
- [ ] **비용**: LLM 호출 비용/무료 한도가 운영에 부담될 때
- [ ] **스케일**: 동시 사용자↑로 분당 한도(429)가 잦을 때
- [ ] **프라이버시**: 실제 학생 데이터가 흐르기 시작 → 이미지를 외부 LLM에 안 보내고 싶을 때(규칙 6) → **온프레미스 OSS OCR**
- [ ] **수식 정확도**: 고학년 수식(분수·지수·도형 기호) 판독 품질이 부족할 때 → **Mathpix**

---

## 4. 권장 아키텍처 옵션

### 옵션 A — 현행 유지 (지금)
멀티모달 LLM(Gemini→Groq). 가장 단순, 추가 인프라 0.

### 옵션 B — 하이브리드 (비용·프라이버시 절충)
```
이미지 → [OCR(온프레미스/저가)] → 원문 텍스트
        → [LLM 소량] 수식 보정 + is_math 판단 + 정리
        → "이 문제 맞아?" 확인
```
OCR이 비용·프라이버시를, LLM이 까다로운 수식·판단을 담당.

### 옵션 C — 수식 특화 보강
Stage A에 **Mathpix**를 폴백/병행으로. 수식 비중 큰 문항에서 LaTeX 충실도↑.

### 옵션 D — 완전 온프레미스
**GOT-OCR2 / PaddleOCR** 자체 호스팅으로 이미지가 외부로 안 나감. 실서비스 프라이버시 최상, 운영 부담 최대.

> 어떤 옵션이든 우리 파이프라인은 Stage A만 교체하면 됨(`/api/analyze` + `lib/llm` 어댑터 경계). **`lib/llm`에 OCR 어댑터를 하나 더 추가**하는 식으로 확장 가능.

---

## 5. PoC 시 확인 체크리스트 (실험할 때 채우기)

대상: __________ (예: PaddleOCR / Mathpix …) · 날짜: ______

- [ ] 한국어 문장제 정확도 (테스트 N개 중 정확 M개)
- [ ] 수식(분수/지수/도형) 깨짐 여부
- [ ] 손글씨 인식 정도
- [ ] 사진 왜곡(기울기/그림자/저조도) 견고성
- [ ] 응답 속도(p50/p95)
- [ ] 비용(호출당 / 월 추정) 또는 서버·GPU 요구사항
- [ ] 데이터 처리 위치(온프레미스 vs 외부 전송) — 프라이버시
- [ ] 출력 포맷이 우리 스키마(extracted_question 등)로 매핑되는가
- [ ] 폴백/실패 처리(저신뢰 → 재촬영) 가능 여부

**메모:**
> (여기에 결과 적기)

---

## 6. 참고 링크 (확인용, 변동 가능)

- Mathpix: https://mathpix.com/ocr
- LaTeX-OCR(pix2tex): https://github.com/lukas-blecher/LaTeX-OCR
- texify / Surya: https://github.com/VikParuchuri
- PaddleOCR: https://github.com/PaddlePaddle/PaddleOCR
- GOT-OCR2.0: https://github.com/Ucas-HaoranWei/GOT-OCR2.0
- Naver CLOVA OCR / Upstage Document AI / Google Cloud Vision / Azure AI Vision Read (각 공식 문서)

> ⚠️ 무료 한도·모델명·가격은 자주 바뀐다. 도입 직전 **반드시 최신 공식 문서로 재확인**.
