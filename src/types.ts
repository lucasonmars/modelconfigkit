/** Modality primitives used for capability filtering. */
export type Modality = "text" | "image" | "audio" | "video" | "pdf" | "3d_model";

/** Directional capability: what goes in → what comes out. */
export type DirectionalCapability = {
  from: Modality | Modality[];
  to: Modality | Modality[];
  /** Stable task id, e.g. chat | vqa | text-to-image | asr | tts */
  task: string;
  bidirectional?: boolean;
};

export type ModelFeatures = {
  tool_call?: boolean;
  structured_output?: boolean;
  reasoning?: boolean;
  streaming?: boolean;
  vision?: boolean;
  temperature?: boolean;
  attachment?: boolean;
  json_mode?: boolean;
  embedding?: boolean;
};

export type ModelLimits = {
  context?: number | null;
  output?: number | null;
};

/** Capability facts — provider-agnostic "what the model can do". */
export type CapabilityFact = {
  id: string;
  name?: string;
  family?: string | null;
  lab?: string | null;
  modalities: {
    input: Modality[];
    output: Modality[];
  };
  directional?: DirectionalCapability[];
  features: ModelFeatures;
  limits: ModelLimits;
  /** Provenance tags for reused upstream data. */
  sources?: string[];
};

export type MultimodalFormat =
  | "openai_image_url"
  | "anthropic_base64"
  | "gemini_inline_data"
  | "openai_compatible";

/** Calling adapter — provider-specific "how to call it". */
export type AdapterRule = {
  provider: string;
  /** Models this rule applies to. Empty / ["*"] = all under provider. */
  models?: string[];
  api_style:
    | "openai-chat"
    | "openai-responses"
    | "anthropic-messages"
    | "gemini-generate"
    | "ollama"
    | "custom";
  base_url?: string;
  endpoint?: string;
  auth?: "bearer" | "x-api-key" | "query" | "none";
  /** Canonical param → provider param. */
  param_mapping?: Record<string, string>;
  /** Params that must be stripped for this provider/model family. */
  unsupported_params?: string[];
  /** Sensible defaults applied when user omits them. */
  defaults?: Record<string, unknown>;
  multimodal_format?: MultimodalFormat;
  /** Extra static headers (no secrets). */
  headers?: Record<string, string>;
};

export type ProviderMeta = {
  id: string;
  name?: string;
  npm?: string | null;
  api?: string | null;
  /** Public human docs — also mirrored in ops (not the update pipeline). */
  doc?: string | null;
  env?: string[];
};

export type RegistryManifest = {
  version: string;
  generated_at: string;
  model_count: number;
  provider_count: number;
  adapter_count: number;
  sources: string[];
  /** Reserved for future paid sync / subscription endpoint. */
  subscription?: {
    enabled: boolean;
    endpoint?: string;
    note?: string;
  };
};

export type RegistryBundle = {
  manifest: RegistryManifest;
  providers: Record<string, ProviderMeta>;
  /** model_id → capability (deduped by canonical id when possible). */
  capabilities: Record<string, CapabilityFact>;
  /** provider/model deployment rows linking to capability id. */
  deployments: Array<{
    provider: string;
    model: string;
    capability_id: string;
    /** Optional LiteLLM / upstream aliases. */
    aliases?: string[];
  }>;
  adapters: AdapterRule[];
};

export type CapabilityQuery = {
  task?: string;
  input?: Modality | Modality[];
  output?: Modality | Modality[];
  feature?: keyof ModelFeatures;
  provider?: string;
};

export type ResolveInput = {
  provider: string;
  model: string;
  apiKey?: string;
  /** User overrides — win over registry defaults. */
  overrides?: Record<string, unknown>;
  baseUrl?: string;
};

export type ResolvedConfig = {
  provider: string;
  model: string;
  capability: CapabilityFact;
  adapter: AdapterRule;
  /** Final params ready to send (defaults ∪ mapped overrides, unsupported stripped). */
  params: Record<string, unknown>;
  /** Params that were stripped as unsupported. */
  stripped: string[];
  /** Params that were renamed. */
  renamed: Array<{ from: string; to: string }>;
  request: {
    base_url: string;
    endpoint: string;
    auth: AdapterRule["auth"];
    headers: Record<string, string>;
    multimodal_format: MultimodalFormat;
    api_style: AdapterRule["api_style"];
  };
};
