import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadRegistry, setRegistry, getRegistry } from "./registry.js";
import { resolveConfig, mapParams } from "./resolve.js";
import {
  queryModels,
  getStats,
  listProviders,
  getModel,
} from "./query.js";
import { convertMultimodal } from "./multimodal.js";
import type {
  ResolveInput,
  ResolvedConfig,
  RegistryBundle,
  CapabilityQuery,
} from "./types.js";

export type {
  Modality,
  DirectionalCapability,
  ModelFeatures,
  ModelLimits,
  CapabilityFact,
  MultimodalFormat,
  AdapterRule,
  ProviderMeta,
  RegistryManifest,
  RegistryBundle,
  ResolveInput,
  ResolvedConfig,
  CapabilityQuery,
} from "./types.js";

export {
  loadRegistry,
  setRegistry,
  getRegistry,
  resolveConfig,
  mapParams,
  queryModels,
  getStats,
  listProviders,
  getModel,
  convertMultimodal,
};

/** Default data path shipped with the package. */
export function defaultRegistryPath(): string {
  return fileURLToPath(new URL("../data/registry.json", import.meta.url));
}

export function loadBundledRegistry(): RegistryBundle {
  const raw = readFileSync(defaultRegistryPath(), "utf8");
  const bundle = JSON.parse(raw) as RegistryBundle;
  setRegistry(bundle);
  return bundle;
}

/**
 * One-liner for host apps: only provider + model + apiKey are required.
 * Defaults fill the annoying params; overrides are optional.
 */
export async function createClient(input: ResolveInput): Promise<{
  config: ResolvedConfig;
  chatPayload: (body: {
    messages: unknown[];
    params?: Record<string, unknown>;
  }) => {
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
  };
}> {
  if (!getRegistrySafe()) {
    await loadRegistry();
  }
  const config = resolveConfig(input);

  return {
    config,
    chatPayload({ messages, params }) {
      const mapped = mapParams(params ?? {}, config.adapter);
      return {
        url: `${config.request.base_url}${config.request.endpoint}`,
        headers: {
          "content-type": "application/json",
          ...config.request.headers,
        },
        body: {
          model: config.model,
          messages,
          ...mapped.params,
        },
      };
    },
  };
}

function getRegistrySafe(): RegistryBundle | null {
  try {
    return getRegistry();
  } catch {
    return null;
  }
}

export type { CapabilityQuery as Query };
