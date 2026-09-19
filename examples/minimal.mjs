import { loadBundledRegistry, createClient, getStats } from "../dist/index.js";

loadBundledRegistry();
console.log("adapted models:", getStats().model_count);

const { chatPayload, config } = await createClient({
  provider: "deepseek",
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY ?? "sk-demo",
  overrides: { temperature: 0.2 },
});

console.log("stripped:", config.stripped);
console.log("params:", config.params);
console.log("url:", chatPayload({ messages: [{ role: "user", content: "hi" }] }).url);
