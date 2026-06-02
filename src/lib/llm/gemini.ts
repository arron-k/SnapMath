import "server-only";
import type { ContentListUnion } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/client";
import type { LlmRequest } from "@/lib/llm/content";

export async function geminiGenerate(
  model: string,
  req: LlmRequest,
): Promise<string> {
  const ai = getGeminiClient();
  const parts = req.content.map((part) =>
    "text" in part
      ? { text: part.text }
      : {
          inlineData: { mimeType: part.image.mimeType, data: part.image.base64 },
        },
  );

  const res = await ai.models.generateContent({
    model,
    contents: parts as ContentListUnion,
    config: {
      systemInstruction: req.systemInstruction,
      responseMimeType: "application/json",
      responseSchema: req.responseSchema,
    },
  });

  return res.text ?? "";
}
