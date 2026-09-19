import { getRegistry, matchAdapter } from "./registry.js";
import type {
  ResolveInput,
  ResolvedConfig,
  RegistryBundle,
} from "./types.js";

const DEFAULT_BASE: Record<string, string> = {
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
  google: "https://generativelanguage.googleapis.com",
  deepseek: "https://api.deepseek.com",
  moonshotai: "https://api.moonshot.ai",
  alibaba: "https://dashscope-intl.aliyuncs.com/compatible-mode",
  openrouter: "https://openrouter.ai/api",
  siliconflow: "https://api.siliconflow.cn",
  groq: "https://api.groq.com/openai",
  together: "https://api.together.xyz",
  ollama: "http://127.0.0.1:11434",
};

/**
 * Resolve a full call config from the three user fields (+ optional overrides).
 * Annoying provider-specific params are filled from registry defaults;
 * user overrides always win.
 */
export function resolveConfig(
  input: ResolveInput,
  bundle?: RegistryBundle,
): ResolvedConfig {
  const reg = bundle ?? getRegistry();
  const provider = input.provider.trim().toLowerCase();
  const model = input.model.trim();

  const deployment =
    reg.deployments.find(
      (d) =>
        d.provider === provider &&
        (d.model === model ||
          d.aliases?.includes(model) ||
          d.model.endsWith(`/${model}`) ||
          d.model === `${provider}/${model}`),
    ) ??
    reg.deployments.find(
      (d) =>
        d.provider === provider &&
        (d.model.includes(model) || model.includes(d.model)),
    );

  const capabilityId = deployment?.capability_id ?? model;
  let capability = reg.capabilities[capabilityId];

  if (!capability) {
    // Soft fallback so unknown models still get a usable OpenAI-compatible profile.
    capability = {
      id: model,
      name: model,
      modalities: { input: ["text"], output: ["text"] },
      features: {
        tool_call: true,
        streaming: true,
        temperature: true,
      },
      limits: {},
      sources: ["fallback"],
    };
  }

  const adapter = matchAdapter(reg.adapters, provider, model);
  const providerMeta = reg.providers[provider];

  const base_url =
    input.baseUrl ??
    adapter.base_url ??
    providerMeta?.api ??
    DEFAULT_BASE[provider] ??
    "";

  const endpoint = adapter.endpoint ?? "/v1/chat/completions";
  const auth = adapter.auth ?? "bearer";

  const rawParams: Record<string, unknown> = {
    ...(adapter.defaults ?? {}),
    ...(input.overrides ?? {}),
  };

  const unsupported = new Set(adapter.unsupported_params ?? []);
  const mapping = adapter.param_mapping ?? {};
  const params: Record<string, unknown> = {};
  const stripped: string[] = [];
  const renamed: Array<{ from: string; to: string }> = [];

  for (const [key, value] of Object.entries(rawParams)) {
    if (unsupported.has(key)) {
      stripped.push(key);
      continue;
    }
    const target = mapping[key] ?? key;
    if (target !== key) renamed.push({ from: key, to: target });
    params[target] = value;
  }

  const headers: Record<string, string> = { ...(adapter.headers ?? {}) };
  if (input.apiKey) {
    if (auth === "bearer") headers.Authorization = `Bearer ${input.apiKey}`;
    else if (auth === "x-api-key") headers["x-api-key"] = input.apiKey;
  }

  return {
    provider,
    model: deployment?.model ?? model,
    capability,
    adapter,
    params,
    stripped,
    renamed,
    request: {
      base_url: base_url.replace(/\/$/, ""),
      endpoint,
      auth,
      headers,
      multimodal_format: adapter.multimodal_format ?? "openai_compatible",
      api_style: adapter.api_style,
    },
  };
}

/** Map a unified params object through an adapter without full resolve. */
export function mapParams(
  params: Record<string, unknown>,
  adapter: {
    param_mapping?: Record<string, string>;
    unsupported_params?: string[];
    defaults?: Record<string, unknown>;
  },
): {
  params: Record<string, unknown>;
  stripped: string[];
  renamed: Array<{ from: string; to: string }>;
} {
  const raw = { ...(adapter.defaults ?? {}), ...params };
  const unsupported = new Set(adapter.unsupported_params ?? []);
  const mapping = adapter.param_mapping ?? {};
  const out: Record<string, unknown> = {};
  const stripped: string[] = [];
  const renamed: Array<{ from: string; to: string }> = [];

  for (const [key, value] of Object.entries(raw)) {
    if (unsupported.has(key)) {
      stripped.push(key);
      continue;
    }
    const target = mapping[key] ?? key;
    if (target !== key) renamed.push({ from: key, to: target });
    out[target] = value;
  }
  return { params: out, stripped, renamed };
}
