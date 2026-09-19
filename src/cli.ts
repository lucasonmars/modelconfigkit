#!/usr/bin/env node
import { loadBundledRegistry, getStats, queryModels, resolveConfig, listProviders } from "./index.js";

function usage(): never {
  console.log(`providerkit — embedded AI model config kit

Usage:
  providerkit stats
  providerkit providers
  providerkit query --task <task> [--input text] [--output image]
  providerkit resolve --provider <p> --model <m> [--temperature 0.2]

Philosophy: fill only provider + model + apiKey; defaults handle the rest.
`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (!args.length) usage();

const cmd = args[0];
const flags = new Map<string, string>();
for (let i = 1; i < args.length; i++) {
  if (args[i].startsWith("--") && args[i + 1] && !args[i + 1].startsWith("--")) {
    flags.set(args[i].slice(2), args[++i]);
  } else if (args[i].startsWith("--")) {
    flags.set(args[i].slice(2), "true");
  }
}

loadBundledRegistry();

if (cmd === "stats") {
  const s = getStats();
  console.log(
    JSON.stringify(
      {
        model_count: s.model_count,
        provider_count: s.provider_count,
        adapter_count: s.adapter_count,
        version: s.version,
        generated_at: s.generated_at,
        sources: s.sources,
        subscription: s.subscription,
      },
      null,
      2,
    ),
  );
} else if (cmd === "providers") {
  console.log(listProviders().join("\n"));
} else if (cmd === "query") {
  const rows = queryModels({
    task: flags.get("task"),
    input: flags.get("input") as never,
    output: flags.get("output") as never,
    provider: flags.get("provider"),
  });
  console.log(JSON.stringify({ count: rows.length, models: rows.slice(0, 50) }, null, 2));
  if (rows.length > 50) console.error(`… ${rows.length - 50} more`);
} else if (cmd === "resolve") {
  const provider = flags.get("provider");
  const model = flags.get("model");
  if (!provider || !model) usage();
  const overrides: Record<string, unknown> = {};
  for (const [k, v] of flags) {
    if (["provider", "model"].includes(k)) continue;
    const num = Number(v);
    overrides[k] = Number.isFinite(num) && v.trim() !== "" && !Number.isNaN(num) ? num : v;
  }
  const cfg = resolveConfig({ provider, model, overrides });
  // Never print secrets
  const { headers, ...request } = cfg.request;
  console.log(
    JSON.stringify(
      {
        provider: cfg.provider,
        model: cfg.model,
        capability: cfg.capability,
        params: cfg.params,
        stripped: cfg.stripped,
        renamed: cfg.renamed,
        request: { ...request, headers: Object.keys(headers) },
      },
      null,
      2,
    ),
  );
} else {
  usage();
}
