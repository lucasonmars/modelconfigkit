import { getRegistry } from "./registry.js";
import type {
  CapabilityFact,
  CapabilityQuery,
  Modality,
  RegistryBundle,
  RegistryManifest,
} from "./types.js";

export type { CapabilityQuery };

function asList<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function includesAll(hay: Modality[], needles: Modality[]): boolean {
  return needles.every((n) => hay.includes(n));
}

/** Filter models by directional capability / modality / feature. */
export function queryModels(
  query: CapabilityQuery,
  bundle?: RegistryBundle,
): Array<{
  provider?: string;
  model: string;
  capability: CapabilityFact;
}> {
  const reg = bundle ?? getRegistry();
  const results: Array<{
    provider?: string;
    model: string;
    capability: CapabilityFact;
  }> = [];

  const wantIn = asList(query.input);
  const wantOut = asList(query.output);

  const deployments = query.provider
    ? reg.deployments.filter((d) => d.provider === query.provider)
    : reg.deployments;

  const seen = new Set<string>();

  for (const d of deployments) {
    const cap = reg.capabilities[d.capability_id];
    if (!cap) continue;

    if (wantIn.length && !includesAll(cap.modalities.input, wantIn)) continue;
    if (wantOut.length && !includesAll(cap.modalities.output, wantOut))
      continue;

    if (query.feature && !cap.features[query.feature]) continue;

    if (query.task) {
      const dirs = cap.directional ?? [];
      if (!dirs.some((x) => x.task === query.task)) continue;
    }

    const key = `${d.provider}/${d.model}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ provider: d.provider, model: d.model, capability: cap });
  }

  return results;
}

export function getStats(bundle?: RegistryBundle): RegistryManifest {
  return (bundle ?? getRegistry()).manifest;
}

export function listProviders(bundle?: RegistryBundle): string[] {
  return Object.keys((bundle ?? getRegistry()).providers).sort();
}

export function getModel(
  provider: string,
  model: string,
  bundle?: RegistryBundle,
): CapabilityFact | null {
  const reg = bundle ?? getRegistry();
  const d = reg.deployments.find(
    (x) =>
      x.provider === provider &&
      (x.model === model || x.aliases?.includes(model)),
  );
  if (!d) return null;
  return reg.capabilities[d.capability_id] ?? null;
}
