# ProviderKit

**下载这一份，就够配模型。**

可嵌入的 AI 模型配置知识库：终端用户只填 **供应商 + 模型 + API Key**。那些讨厌的参数有合理默认值，也允许自行覆盖；多模态格式与参数名差异在本地自动映射。

> 不是网关，不是代理。是跑在你软件内部的 **能力注册表 + 调用适配层**，主动构造目标模型能正确接受的请求。

## 和现有方案的区别

| | LiteLLM / OpenRouter | LangChain / AI SDK | models.dev | **ProviderKit** |
|--|--|--|--|--|
| 形态 | 网关 / 云路由 | 应用框架 | 元数据仓库 | **可嵌入组件** |
| 参数策略 | 丢弃 / 忽略 | 预写集成包 | 只记录不执行 | **运行时主动映射** |
| 部署 | 依赖外部服务 | 引入框架 | 无运行时 | **零外部依赖** |

## 支持规模

安装后执行：

```bash
npx providerkit stats
```

会打印当前包内适配的 **模型数 / 供应商数 / 适配器数**（写入 `data/registry.json` 的 `manifest`）。

数据复用自：

- [models.dev](https://models.dev) — 模态、上下文、能力标记
- [LiteLLM 价格与上下文表](https://github.com/BerriAI/litellm) — mode / vision / tools 等增强

内置适配器覆盖：OpenAI、Anthropic、Google Gemini、DeepSeek、Moonshot、阿里云、OpenRouter、Ollama、vLLM、SiliconFlow、Groq，以及通用 OpenAI-compatible 回退。

## 安装

```bash
npm install providerkit
```

## 三字段用法

```ts
import { loadBundledRegistry, createClient, queryModels, getStats } from "providerkit";

loadBundledRegistry();
console.log(`已适配 ${getStats().model_count} 个模型部署`);

const { chatPayload } = await createClient({
  provider: "deepseek",
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  overrides: { temperature: 0.3 }, // 可选
});
```

按能力筛选（文生图 / 图生文 / 语音等）：

```ts
queryModels({ task: "text-to-image" });
queryModels({ input: "image", output: "text" });
queryModels({ task: "tts" });
```

## 更新机制与厂商文档

**不在本公开仓库同步。** 厂商文档地址、抓取规则与文档快照放在私有 ops 目录，用于定期刷新注册表。开源包保持离线可用；`manifest.subscription` 预留了后续「订阅同步最新 overlay」的入口，不影响免费核心。

## 许可

- 代码：MIT
- 聚合数据：遵循各上游项目条款，来源见 `manifest.sources`
