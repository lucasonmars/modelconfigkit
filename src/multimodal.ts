import type { MultimodalFormat } from "./types.js";

export type UnifiedPart =
  | { type: "text"; text: string }
  | { type: "image"; url?: string; base64?: string; mime?: string }
  | { type: "audio"; url?: string; base64?: string; mime?: string }
  | { type: "video"; url?: string; base64?: string; mime?: string };

/**
 * Convert unified multimodal parts into a provider-native message content shape.
 * This is the runtime mapping LiteLLM/OpenRouter typically skip (drop/ignore).
 */
export function convertMultimodal(
  parts: UnifiedPart[],
  format: MultimodalFormat,
): unknown {
  switch (format) {
    case "openai_image_url":
    case "openai_compatible":
      return parts.map((p) => {
        if (p.type === "text") return { type: "text", text: p.text };
        if (p.type === "image") {
          const url =
            p.url ??
            (p.base64
              ? `data:${p.mime ?? "image/png"};base64,${p.base64}`
              : undefined);
          return { type: "image_url", image_url: { url } };
        }
        return { type: "text", text: `[unsupported part: ${p.type}]` };
      });

    case "anthropic_base64":
      return parts.map((p) => {
        if (p.type === "text") return { type: "text", text: p.text };
        if (p.type === "image") {
          if (p.base64) {
            return {
              type: "image",
              source: {
                type: "base64",
                media_type: p.mime ?? "image/png",
                data: p.base64,
              },
            };
          }
          return {
            type: "image",
            source: { type: "url", url: p.url },
          };
        }
        return { type: "text", text: `[unsupported part: ${p.type}]` };
      });

    case "gemini_inline_data":
      return parts.map((p) => {
        if (p.type === "text") return { text: p.text };
        if (p.type === "image" && p.base64) {
          return {
            inline_data: {
              mime_type: p.mime ?? "image/png",
              data: p.base64,
            },
          };
        }
        if (p.type === "image" && p.url) {
          return { file_data: { file_uri: p.url } };
        }
        return { text: `[unsupported part: ${p.type}]` };
      });

    default:
      return parts;
  }
}
