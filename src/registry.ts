import type {
  AdapterRule,
  CapabilityFact,
  DirectionalCapability,
  Modality,
  RegistryBundle,
} from "./types.js";

let cached: RegistryBundle | null = null;

export function setRegistry(bundle: RegistryBundle): void {
  cached = bundle;
}

export function getRegistry(): RegistryBundle {
  if (!cached) {
    throw new Error(
      "Registry not loaded. Call loadRegistry() or setRegistry() first.",
    );
  }
  return cached;
}

export async function loadRegistry(
  pathOrUrl?: string | URL,
): Promise<RegistryBundle> {
  if (!pathOrUrl) {
    const url = new URL("../data/registry.json", import.meta.url);
    pathOrUrl = url;
  }

  if (typeof pathOrUrl === "string" && /^https?:\/\//i.test(pathOrUrl)) {
    const res = await fetch(pathOrUrl);
    if (!res.ok) throw new Error(`Failed to fetch registry: ${res.status}`);
    cached = (await res.json()) as RegistryBundle;
    return cached;
  }

  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const file =
    pathOrUrl instanceof URL
      ? fileURLToPath(pathOrUrl)
      : pathOrUrl.startsWith("file:")
        ? fileURLToPath(pathOrUrl)
        : pathOrUrl;
  const raw = await readFile(file, "utf8");
  cached = JSON.parse(raw) as RegistryBundle;
  return cached;
}

export function inferDirectional(
  input: Modality[],
  output: Modality[],
  features: CapabilityFact["features"],
): DirectionalCapability[] {
  const dirs: DirectionalCapability[] = [];
  const has = (arr: Modality[], m: Modality) => arr.includes(m);

  if (has(input, "text") && has(output, "text")) {
    dirs.push({ from: "text", to: "text", task: "chat" });
  }
  if (has(input, "image") && has(output, "text")) {
    dirs.push({ from: "image", to: "text", task: "vqa" });
  }
  if (has(input, "text") && has(output, "image")) {
    dirs.push({ from: "text", to: "image", task: "text-to-image" });
  }
  if (has(input, "image") && has(output, "image")) {
    dirs.push({
      from: ["image", "text"],
      to: "image",
      task: "image-to-image",
    });
  }
  if (has(input, "video") && has(output, "text")) {
    dirs.push({ from: "video", to: "text", task: "video-to-text" });
  }
  if (
    (has(input, "text") || has(input, "image")) &&
    has(output, "video")
  ) {
    dirs.push({
      from: has(input, "image") ? ["text", "image"] : "text",
      to: "video",
      task: has(input, "image") ? "image-to-video" : "text-to-video",
    });
  }
  if (has(input, "audio") && has(output, "text")) {
    dirs.push({ from: "audio", to: "text", task: "asr" });
  }
  if (has(input, "text") && has(output, "audio")) {
    dirs.push({ from: "text", to: "audio", task: "tts" });
  }
  if (features.embedding) {
    dirs.push({ from: "text", to: "text", task: "embedding" });
  }
  return dirs;
}

export function matchAdapter(
  adapters: AdapterRule[],
  provider: string,
  model: string,
): AdapterRule {
  const providerRules = adapters.filter(
    (a) => a.provider === provider || a.provider === "*",
  );
  const specific = providerRules.find((a) =>
    (a.models ?? []).some(
      (m) => m !== "*" && (m === model || model.startsWith(m)),
    ),
  );
  if (specific) return specific;

  const wildcard = providerRules.find(
    (a) =>
      !a.models?.length ||
      a.models.includes("*") ||
      a.provider === provider,
  );
  if (wildcard) return wildcard;

  // Fallback: OpenAI-compatible defaults for unknown providers.
  return {
    provider,
    api_style: "openai-chat",
    endpoint: "/v1/chat/completions",
    auth: "bearer",
    param_mapping: {},
    unsupported_params: [],
    defaults: { temperature: 0.7 },
    multimodal_format: "openai_compatible",
  };
}
