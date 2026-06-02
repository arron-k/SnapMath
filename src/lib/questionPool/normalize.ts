import "server-only";
import { createHash } from "node:crypto";

export function normalizeQuestionText(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,!?;:'"`~·…∙•\-_/\\()[\]{}<>]/g, "")
    .trim();
}

export function questionHash(raw: string): string {
  return createHash("sha256").update(normalizeQuestionText(raw)).digest("hex");
}

const PII_PATTERNS: RegExp[] = [
  /\d{2,3}-\d{3,4}-\d{4}/, // 전화번호
  /\d{6}-\d{7}/, // 주민등록번호 형태
  /[\w.+-]+@[\w-]+\.[\w.-]+/, // 이메일
  /(이름|성명|연락처|전화번호)\s*[:：]/, // 식별정보 라벨
];

export function containsLikelyPII(text: string): boolean {
  return PII_PATTERNS.some((re) => re.test(text));
}
