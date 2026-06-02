// 답 비교 정규화 — 단위 표기(㎠·cm²·제곱센티미터)와 형식 차이를 흡수하고 값으로 비교 (규칙 2 예외 허용)
const TRAILING_UNITS =
  /(제곱킬로미터|세제곱센티미터|세제곱미터|제곱센티미터|제곱밀리미터|제곱미터|킬로미터|센티미터|밀리미터|킬로그램|리터|미터|그램|㎢|㎠|㎟|㎡|㎤|㎥|cm²|cm³|mm²|m²|m³|cm2|cm3|m2|m3|cm|mm|km|kg|ml|l|g|m|개|명|원|살|쪽|장|권|자루|송이|마리|배|줄|칸|모둠|상자|봉지|시간|분|초|점|등|번|째|도|°|％|%)+$/;

function stripUnits(raw: string): string {
  let s = raw.normalize("NFKC").trim().toLowerCase();
  s = s.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
  // 띄어쓴 대분수(예: "4 1/12")가 공백 제거로 가분수처럼 붙는 것을 막는다
  s = s.replace(/(\d+)\s+(\d+\s*\/\s*\d+)/g, "$1와$2");
  s = s.replace(/[,\s]/g, "");
  s = s.replace(/(이다|입니다|이에요|예요|요|약|총)$/g, "");
  s = s.replace(TRAILING_UNITS, "");
  return s;
}

function toNumber(s: string): number | null {
  const fraction = s.match(/^(-?\d+)\/(\d+)$/);
  if (fraction) {
    const denom = Number(fraction[2]);
    return denom === 0 ? null : Number(fraction[1]) / denom;
  }
  const mixed = s.match(/^(-?\d+)(?:와|과)?(\d+)\/(\d+)$/);
  if (mixed) {
    const denom = Number(mixed[3]);
    return denom === 0
      ? null
      : Number(mixed[1]) + Number(mixed[2]) / denom;
  }
  const n = Number(s);
  return Number.isFinite(n) && s !== "" ? n : null;
}

export function normalizeAnswer(raw: string): string {
  return stripUnits(raw);
}

export function answersMatch(a: string, b: string): boolean {
  const na = stripUnits(a);
  const nb = stripUnits(b);
  if (na === "" || nb === "") return false;
  if (na === nb) return true;
  const va = toNumber(na);
  const vb = toNumber(nb);
  if (va !== null && vb !== null) return Math.abs(va - vb) < 1e-9;
  return false;
}
