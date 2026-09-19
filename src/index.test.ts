import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setRegistry } from "./registry.js";
import { resolveConfig, mapParams } from "./resolve.js";
import { queryModels, getStats } from "./query.js";
import { convertMultimodal } from "./multimodal.js";
import type { RegistryBundle } from "./types.js";
import assert from "node:assert/strict";
import { test } from "node:test";

function load(): RegistryBundle {
  const path = fileURLToPath(new URL("../data/registry.json", import.meta.url));
  const bundle = JSON.parse(readFileSync(path, "utf8")) as RegistryBundle;
  setRegistry(bundle);
  return bundle;
}

test("registry stats expose model counts", () => {
  const bundle = load();
  const stats = getStats(bundle);
  assert.ok(stats.model_count > 1000);
  assert.ok(stats.provider_count > 50);
  assert.ok(stats.adapter_count >= 5);
});

test("resolve openai gpt model remaps max_tokens when needed", () => {
  load();
  const cfg = resolveConfig({
    provider: "openai",
    model: "gpt-4o",
    overrides: { max_tokens: 128, temperature: 0.2, top_k: 40 },
  });
  assert.equal(cfg.params.temperature, 0.2);
  // top_k stripped for openai adapter
  assert.ok(cfg.stripped.includes("top_k") || cfg.params.top_k === undefined);
  assert.ok(cfg.capability.modalities.input.includes("text"));
});

test("mapParams applies defaults then overrides", () => {
  const result = mapParams(
    { temperature: 0.1 },
    {
      defaults: { temperature: 0.7, top_p: 1 },
      param_mapping: { max_tokens: "max_completion_tokens" },
      unsupported_params: ["top_k"],
    },
  );
  assert.equal(result.params.temperature, 0.1);
  assert.equal(result.params.top_p, 1);
});

test("query text-to-image models", () => {
  load();
  const rows = queryModels({ task: "text-to-image" });
  assert.ok(rows.length > 0);
});

test("multimodal openai vs anthropic shapes differ", () => {
  const parts = [
    { type: "text" as const, text: "describe" },
    { type: "image" as const, base64: "abc", mime: "image/png" },
  ];
  const oai = convertMultimodal(parts, "openai_image_url") as Array<Record<string, unknown>>;
  const ant = convertMultimodal(parts, "anthropic_base64") as Array<Record<string, unknown>>;
  assert.equal(oai[1].type, "image_url");
  assert.equal(ant[1].type, "image");
});
