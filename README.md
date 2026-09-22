# ModelConfigKit

**Download once. Give your software AI — without drowning in model settings.**

When you build an app with AI features, you or your users often need to plug in different model vendors and models. Every provider has its own endpoints, parameter names, defaults, and multimodal formats. That wiring is slow, error-prone, and hard to keep up to date.

**ModelConfigKit is a downloadable model-configuration knowledge base.** Install this one package into your software. Users only fill **provider + model + API key**. Your app gets the rest — how to call that model correctly — and can start talking to it quickly.

> Not a gateway. Not a proxy. A local registry your software queries so it knows how to configure and invoke models.

中文说明：[README.zh-CN.md](./README.zh-CN.md)

## The pain it removes

Without a shared config kit, each product ends up re-solving the same problems:

- OpenAI-compatible APIs that are only *mostly* compatible
- `max_tokens` vs `max_completion_tokens`, `top_k` supported or not
- Image / audio / video payloads shaped differently per vendor
- New or long-tail models that break your hard-coded assumptions

With ModelConfigKit, your product surface stays simple: pick a vendor, pick a model, paste a key. Defaults and mappings fill in the annoying parameters. Power users can still override them.

## What the kit supplies

| User fills | Kit supplies |
|------------|--------------|
| Provider | Adapter rules and default base URL |
| Model | Capabilities, limits, directional tasks (chat, VQA, text-to-image, TTS, …) |
| API Key | Used only locally — never sent through a third party |

Bundled registry size (regenerate with `npm run import:registry`): about **10,200+** model deployments, **300+** providers, **12** built-in adapters. Data reused from [models.dev](https://models.dev) and [LiteLLM](https://github.com/BerriAI/litellm).

## Install

**From GitHub** (use this until the package is published to npm):

```bash
npm install github:lucasonmars/modelconfigkit
```

After npm publish:

```bash
npm install modelconfigkit
```

Check coverage:

```bash
npx --yes github:lucasonmars/modelconfigkit stats
```

## Usage

```ts
import { loadBundledRegistry, createClient, getStats, queryModels } from "modelconfigkit";

loadBundledRegistry();
console.log(`adapted deployments: ${getStats().model_count}`);

const { chatPayload } = await createClient({
  provider: "deepseek",
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  overrides: { temperature: 0.3 }, // optional
});

const req = chatPayload({
  messages: [{ role: "user", content: "hello" }],
});
// fetch(req.url, { method: "POST", headers: req.headers, body: JSON.stringify(req.body) })
```

Filter by capability:

```ts
queryModels({ task: "text-to-image" });
queryModels({ input: "image", output: "text" });
queryModels({ task: "tts" });
```

CLI:

```bash
npx --yes github:lucasonmars/modelconfigkit resolve --provider openai --model gpt-4o
npx --yes github:lucasonmars/modelconfigkit query --task text-to-image
```

## Updates and vendor docs

The refresh pipeline and vendor documentation URLs are **not** kept in this public repo. The published package stays offline-complete. `manifest.subscription` reserves a future paid sync for freshest overlays.

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — **non-commercial use only**. Commercial use needs a separate license from the author.

Bundled upstream registry data follows each source’s terms; see `manifest.sources`.
