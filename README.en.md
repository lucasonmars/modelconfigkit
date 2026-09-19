# ModelConfigKit

**Download once. Configure any model.**

Embeddable AI model **configuration knowledge base**. Users fill **provider + model + API Key**; endpoints, param names, defaults, and multimodal formats come from the kit.

中文说明见 [README.md](./README.md)。

## Install

**Install from GitHub** (not published to the npm registry yet — `npm install modelconfigkit` will 404):

```bash
npm install github:lucasonmars/modelconfigkit
```

After an npm publish, `npm install modelconfigkit` will work.

## Quick usage

```ts
import { loadBundledRegistry, createClient, getStats } from "modelconfigkit";

loadBundledRegistry();
console.log(getStats().model_count);

const { chatPayload } = await createClient({
  provider: "openai",
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
});
```

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — **non-commercial use only**. Commercial use requires a separate license from the author.

Bundled upstream registry data follows each source’s terms; see `manifest.sources`.
