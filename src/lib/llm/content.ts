import { Type, type Schema } from "@google/genai";

export type Provider = "gemini" | "groq";

export interface ModelRef {
  provider: Provider;
  model: string;
}

export type LlmPart =
  | { text: string }
  | { image: { mimeType: string; base64: string } };

export type LlmContent = LlmPart[];

export interface LlmRequest {
  systemInstruction: string;
  content: LlmContent;
  responseSchema: Schema;
}

export interface JsonSchemaNode {
  type: string;
  description?: string;
  properties?: Record<string, JsonSchemaNode>;
  items?: JsonSchemaNode;
  required?: string[];
  additionalProperties?: boolean;
}

export function schemaToJsonSchema(schema: Schema): JsonSchemaNode {
  const desc = schema.description ? { description: schema.description } : {};
  switch (schema.type) {
    case Type.STRING:
      return { type: "string", ...desc };
    case Type.NUMBER:
      return { type: "number", ...desc };
    case Type.INTEGER:
      return { type: "integer", ...desc };
    case Type.BOOLEAN:
      return { type: "boolean", ...desc };
    case Type.ARRAY:
      return {
        type: "array",
        items: schema.items ? schemaToJsonSchema(schema.items) : { type: "string" },
        ...desc,
      };
    case Type.OBJECT: {
      const properties: Record<string, JsonSchemaNode> = {};
      for (const [key, value] of Object.entries(schema.properties ?? {})) {
        properties[key] = schemaToJsonSchema(value as Schema);
      }
      return {
        type: "object",
        properties,
        required: Object.keys(properties),
        additionalProperties: false,
        ...desc,
      };
    }
    default:
      return { type: "string" };
  }
}

export function schemaToShape(schema: Schema): string {
  switch (schema.type) {
    case Type.STRING:
      return "string";
    case Type.NUMBER:
      return "number";
    case Type.INTEGER:
      return "integer";
    case Type.BOOLEAN:
      return "boolean";
    case Type.ARRAY:
      return `[${schema.items ? schemaToShape(schema.items) : "any"}]`;
    case Type.OBJECT: {
      const props = Object.entries(schema.properties ?? {}).map(
        ([key, value]) => `"${key}": ${schemaToShape(value as Schema)}`,
      );
      return `{ ${props.join(", ")} }`;
    }
    default:
      return "any";
  }
}
