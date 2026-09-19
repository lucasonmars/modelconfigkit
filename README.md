# ProviderKit

**Download once. Configure any model.**

An embeddable AI model configuration kit: your users only fill in **provider + model + API key**. Annoying parameters get sensible defaults; multimodal formats and param names are mapped automatically. Users can still override anything.

> Not another LLM gateway. Not a proxy. A local **capability registry + calling adapter** that constructs the correct request for each model.

## Why

Most tools either drop unsupported params (LiteLLM), silently ignore them (OpenRouter), or ask you to rewrite call sites per provider (LangChain / AI SDK). ProviderKit sits inside your app and **actively builds** a request the target model accepts.

## Stats (bundled registry)

Run `npx providerkit stats` after install. The published package ships a registry merged from:

| Source | What we reuse |
|--------|----------------|
| [models.dev](https://models.dev) | Modalities, limits, feature flags, provider metadata |
| [LiteLLM `model_prices_and_context_window.json`](https://github.com/BerriAI/litellm) | Mode / vision / tools / context enrichment |

Exact counts are written into `data/registry.json` → `manifest.model_count` / `provider_count` / `adapter_count` at import time.

## Install

```bash
npm install providerkit
```

## Usage (three fields)

```ts
import { loadBundledRegistry, createClient, queryModels, getStats } from "providerkit";

loadBundledRegistry();
console.log(getStats().model_count); // how many model deployments are adapted

const { config, chatPayload } = await createClient({
  provider: "openai",
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
  // optional overrides — win over defaults
  overrides: { temperature: 0.2, max_tokens: 512 },
});

const req = chatPayload({
  messages: [{ role: "user", content: "hello" }],
});
// fetch(req.url, { method: "POST", headers: req.headers, body: JSON.stringify(req.body) })
```

Filter by capability:

```ts
queryModels({ task: "text-to-image" });
queryModels({ input: "image", output: "text" }); // VQA / vision understanding
queryModels({ task: "asr" });
```

CLI:

```bash
npx providerkit stats
npx providerkit resolve --provider anthropic --model claude-sonnet-4-5 --temperature 0.5
npx providerkit query --task text-to-image
```

## Architecture

1. **Capability facts** — what a model can do (modalities, directional tasks, limits)
2. **Calling adapters** — how to call it (param mapping, unsupported strip, multimodal format, defaults)
3. **Resolver** — merge registry defaults + user overrides; never send API keys to a third party

Update pipeline & vendor documentation URLs are **intentionally not** in this repository (kept in a private ops tree). The open package stays offline-complete; a signed **subscription sync** for freshest overlays is reserved in `manifest.subscription`.

## License

- Code: MIT
- Bundled registry data: aggregated from upstream projects under their respective terms; attribution in `manifest.sources`
