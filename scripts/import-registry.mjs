#!/usr/bin/env node
/**
 * Import reusable model metadata from public sources into data/registry.json.
 * Sources (attribution in manifest.sources):
 *   - models.dev API (capabilities / modalities / limits)
 *   - LiteLLM model_prices_and_context_window.json (mode flags / context)
 *
 * Vendor doc URLs for the *update pipeline* live in ../provider-ops (not synced).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const MODELS_DEV_URL = process.env.MODELS_DEV_URL ?? "https://models.dev/api.json";
const LITELLM_URL =
  process.env.LITELLM_URL ??
  "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.json();
}

function inferDirectional(input, output, features) {
  const dirs = [];
  const has = (arr, m) => arr.includes(m);
  if (has(input, "text") && has(output, "text"))
    dirs.push({ from: "text", to: "text", task: "chat" });
  if (has(input, "image") && has(output, "text"))
    dirs.push({ from: "image", to: "text", task: "vqa" });
  if (has(input, "text") && has(output, "image"))
    dirs.push({ from: "text", to: "image", task: "text-to-image" });
  if (has(input, "image") && has(output, "image"))
    dirs.push({
      from: ["image", "text"],
      to: "image",
      task: "image-to-image",
    });
  if (has(input, "video") && has(output, "text"))
    dirs.push({ from: "video", to: "text", task: "video-to-text" });
  if ((has(input, "text") || has(input, "image")) && has(output, "video"))
    dirs.push({
      from: has(input, "image") ? ["text", "image"] : "text",
      to: "video",
      task: has(input, "image") ? "image-to-video" : "text-to-video",
    });
  if (has(input, "audio") && has(output, "text"))
    dirs.push({ from: "audio", to: "text", task: "asr" });
  if (has(input, "text") && has(output, "audio"))
    dirs.push({ from: "text", to: "audio", task: "tts" });
  if (features.embedding)
    dirs.push({ from: "text", to: "text", task: "embedding" });
  return dirs;
}

function normalizeModality(m) {
  const map = {
    text: "text",
    image: "image",
    audio: "audio",
    video: "video",
    pdf: "pdf",
    "3d": "3d_model",
    "3d_model": "3d_model",
  };
  return map[String(m).toLowerCase()] ?? null;
}

console.log("Fetching models.dev …");
const modelsDev = await fetchJson(MODELS_DEV_URL);
console.log("Fetching LiteLLM prices …");
const litellm = await fetchJson(LITELLM_URL);

const adapters = JSON.parse(
  readFileSync(join(root, "data/adapters/builtin.json"), "utf8"),
);

const providers = {};
const capabilities = {};
const deployments = [];

// Index LiteLLM by model name for enrichment
const liteByName = new Map();
for (const [key, val] of Object.entries(litellm)) {
  if (key === "sample_spec" || !val || typeof val !== "object") continue;
  liteByName.set(key.toLowerCase(), val);
  const short = key.includes("/") ? key.split("/").slice(1).join("/") : key;
  if (!liteByName.has(short.toLowerCase()))
    liteByName.set(short.toLowerCase(), val);
}

for (const [pid, p] of Object.entries(modelsDev)) {
  providers[pid] = {
    id: pid,
    name: p.name ?? pid,
    npm: p.npm ?? null,
    api: p.api ?? null,
    // Public doc link kept for consumers; update-pipeline URLs live in provider-ops.
    doc: p.doc ?? null,
    env: p.env ?? [],
  };

  for (const [mid, m] of Object.entries(p.models ?? {})) {
    const modelId = m.id ?? mid;
    const mods = m.modalities ?? {};
    const input = (mods.input ?? ["text"])
      .map(normalizeModality)
      .filter(Boolean);
    const output = (mods.output ?? ["text"])
      .map(normalizeModality)
      .filter(Boolean);

    const lite =
      liteByName.get(String(modelId).toLowerCase()) ||
      liteByName.get(String(mid).toLowerCase()) ||
      liteByName.get(`${pid}/${mid}`.toLowerCase());

    const features = {
      tool_call: Boolean(m.tool_call ?? lite?.supports_function_calling),
      structured_output: Boolean(
        m.structured_output ?? lite?.supports_response_schema,
      ),
      reasoning: Boolean(m.reasoning ?? lite?.supports_reasoning),
      streaming: true,
      vision: Boolean(
        input.includes("image") || lite?.supports_vision,
      ),
      temperature: m.temperature !== false,
      attachment: Boolean(m.attachment),
      json_mode: Boolean(lite?.supports_response_schema),
      embedding: lite?.mode === "embedding",
    };

    const lim = m.limit ?? {};
    const limits = {
      context:
        lim.context ??
        lite?.max_input_tokens ??
        lite?.max_tokens ??
        null,
      output: lim.output ?? lite?.max_output_tokens ?? null,
    };

    const sources = ["models.dev"];
    if (lite) sources.push("litellm");

    const capability_id = `${pid}/${modelId}`;
    if (!capabilities[capability_id]) {
      capabilities[capability_id] = {
        id: capability_id,
        name: m.name ?? mid,
        family: m.family ?? null,
        lab: p.name ?? pid,
        modalities: { input, output },
        directional: inferDirectional(input, output, features),
        features,
        limits,
        sources,
      };
    }

    deployments.push({
      provider: pid,
      model: modelId,
      capability_id,
      aliases: modelId !== mid ? [mid] : undefined,
    });
  }
}

// Enrich with LiteLLM-only models not present in models.dev
let litellmOnly = 0;
for (const [key, val] of Object.entries(litellm)) {
  if (key === "sample_spec" || !val || typeof val !== "object") continue;
  const provider = (val.litellm_provider || "unknown").toLowerCase();
  const model = key.includes("/") ? key.split("/").slice(1).join("/") : key;
  const exists = deployments.some(
    (d) =>
      d.model === key ||
      d.model === model ||
      d.aliases?.includes(key) ||
      d.aliases?.includes(model),
  );
  if (exists) continue;

  if (!providers[provider]) {
    providers[provider] = {
      id: provider,
      name: provider,
      npm: null,
      api: null,
      doc: null,
      env: [],
    };
  }

  const mode = val.mode;
  let input = ["text"];
  let output = ["text"];
  if (mode === "image_generation") {
    input = ["text"];
    output = ["image"];
  } else if (mode === "image_edit") {
    input = ["image", "text"];
    output = ["image"];
  } else if (mode === "audio_transcription") {
    input = ["audio"];
    output = ["text"];
  } else if (mode === "audio_speech") {
    input = ["text"];
    output = ["audio"];
  } else if (mode === "video_generation") {
    input = ["text"];
    output = ["video"];
  } else if (mode === "embedding") {
    input = ["text"];
    output = ["text"];
  }
  if (val.supports_vision) input = [...new Set([...input, "image"])];

  const features = {
    tool_call: Boolean(val.supports_function_calling),
    structured_output: Boolean(val.supports_response_schema),
    reasoning: Boolean(val.supports_reasoning),
    streaming: true,
    vision: Boolean(val.supports_vision),
    temperature: true,
    attachment: false,
    json_mode: Boolean(val.supports_response_schema),
    embedding: mode === "embedding",
  };

  const capability_id = key;
  capabilities[capability_id] = {
    id: capability_id,
    name: model,
    family: null,
    lab: provider,
    modalities: { input, output },
    directional: inferDirectional(input, output, features),
    features,
    limits: {
      context: val.max_input_tokens ?? val.max_tokens ?? null,
      output: val.max_output_tokens ?? null,
    },
    sources: ["litellm"],
  };
  deployments.push({
    provider,
    model: key,
    capability_id,
    aliases: model !== key ? [model] : undefined,
  });
  litellmOnly++;
}

const bundle = {
  manifest: {
    version: "0.1.0",
    generated_at: new Date().toISOString(),
    model_count: deployments.length,
    provider_count: Object.keys(providers).length,
    adapter_count: adapters.length,
    sources: [
      "https://models.dev",
      "https://github.com/BerriAI/litellm (model_prices_and_context_window.json)",
    ],
    subscription: {
      enabled: false,
      endpoint: "",
      note: "Reserved for optional paid sync of freshest registry overlays. Core package remains fully offline.",
    },
  },
  providers,
  capabilities,
  deployments,
  adapters,
};

mkdirSync(join(root, "data"), { recursive: true });
const out = join(root, "data/registry.json");
writeFileSync(out, JSON.stringify(bundle));
console.log(
  `Wrote ${out}\n  deployments=${deployments.length}\n  providers=${Object.keys(providers).length}\n  capabilities=${Object.keys(capabilities).length}\n  litellm_only=${litellmOnly}\n  adapters=${adapters.length}`,
);
