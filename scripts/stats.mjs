#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const reg = JSON.parse(readFileSync(join(root, "data/registry.json"), "utf8"));
const m = reg.manifest;
console.log(`ProviderKit registry
  models:     ${m.model_count}
  providers:  ${m.provider_count}
  adapters:   ${m.adapter_count}
  version:    ${m.version}
  generated:  ${m.generated_at}
  sources:    ${m.sources.join("; ")}
  subscription.enabled: ${m.subscription?.enabled ?? false}
`);
