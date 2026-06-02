import "server-only";
import {
  schemaToJsonSchema,
  schemaToShape,
  type LlmRequest,
} from "@/lib/llm/content";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqError extends Error {
  status?: number;
}

type GroqUserPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type GroqResponseFormat =
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: { name: string; schema: unknown; strict: boolean };
    };

async function callGroq(
  model: string,
  system: string,
  userContent: GroqUserPart[],
  apiKey: string,
  responseFormat: GroqResponseFormat,
): Promise<Response> {
  return fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      response_format: responseFormat,
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });
}

export async function groqGenerate(
  model: string,
  req: LlmRequest,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const userContent: GroqUserPart[] = req.content.map((part) =>
    "text" in part
      ? { type: "text", text: part.text }
      : {
          type: "image_url",
          image_url: {
            url: `data:${part.image.mimeType};base64,${part.image.base64}`,
          },
        },
  );

  const system = `${req.systemInstruction}\n\n[출력 형식] 반드시 아래 JSON 한 개로만 응답한다. 코드펜스·설명·여는말 금지.\n${schemaToShape(req.responseSchema)}`;

  let res = await callGroq(model, system, userContent, apiKey, {
    type: "json_schema",
    json_schema: {
      name: "snapmath_result",
      schema: schemaToJsonSchema(req.responseSchema),
      strict: true,
    },
  });

  if (!res.ok && res.status === 400) {
    // json_schema 미지원/검증 실패 시 json_object 모드로 1회 폴백
    res = await callGroq(model, system, userContent, apiKey, {
      type: "json_object",
    });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err: GroqError = new Error(
      `GROQ_${res.status} ${detail.slice(0, 200)}`,
    );
    err.status = res.status;
    throw err;
  }

  const data: { choices?: { message?: { content?: string } }[] } =
    await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
