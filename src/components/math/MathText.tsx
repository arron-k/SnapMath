"use client";

import { useMemo } from "react";
import katex from "katex";

type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean };

const MATH_PATTERN =
  /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)/g;

function parse(input: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  for (const match of input.matchAll(MATH_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: input.slice(lastIndex, index) });
    }
    const display = match[1] !== undefined || match[2] !== undefined;
    const tex = match[1] ?? match[2] ?? match[3] ?? match[4] ?? "";
    segments.push({ type: "math", value: tex, display });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < input.length) {
    segments.push({ type: "text", value: input.slice(lastIndex) });
  }
  return segments;
}

function renderTex(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      output: "htmlAndMathml",
    });
  } catch {
    return tex;
  }
}

export function MathText({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const segments = useMemo(() => parse(children ?? ""), [children]);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <span
            key={i}
            // KaTeX 출력은 신뢰된 내부 렌더 결과(throwOnError=false로 안전화)
            dangerouslySetInnerHTML={{
              __html: renderTex(seg.value, seg.display),
            }}
          />
        ),
      )}
    </span>
  );
}
