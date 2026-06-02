const TRAILING_UNITS =
  /(개|명|원|살|쪽|장|권|자루|송이|마리|배|줄|칸|모둠|상자|봉지|시간|분|초|점|등|번|째|cm²|cm³|cm|mm|km|kg|g|ml|l|m²|m³|m|°|도|％|%)+$/;

function normalize(raw: string): string {
  // 전각 숫자→반각, 공백·콤마 제거, 한글 조사/단위 꼬리 제거 후 비교 (규칙 2 예외 허용)
  let s = raw.trim().toLowerCase();
  s = s.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
  s = s.replace(/[,\s]/g, "");
  s = s.replace(/(이다|입니다|이에요|예요|요|개입니다)$/, "");
  s = s.replace(TRAILING_UNITS, "");
  return s;
}

function toNumber(s: string): number | null {
  const fraction = s.match(/^(-?\d+)\/(\d+)$/);
  if (fraction) {
    const denom = Number(fraction[2]);
    return denom === 0 ? null : Number(fraction[1]) / denom;
  }
  const mixed = s.match(/^(-?\d+)와(\d+)\/(\d+)$/);
  if (mixed) {
    const denom = Number(mixed[3]);
    return denom === 0 ? null : Number(mixed[1]) + Number(mixed[2]) / denom;
  }
  const n = Number(s);
  return Number.isFinite(n) && s !== "" ? n : null;
}

export function compareAnswer(input: string, correct: string): boolean {
  const a = normalize(input);
  const b = normalize(correct);
  if (a === "") return false;
  if (a === b) return true;
  const na = toNumber(a);
  const nb = toNumber(b);
  if (na !== null && nb !== null) return Math.abs(na - nb) < 1e-9;
  return false;
}
