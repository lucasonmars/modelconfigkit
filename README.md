# ModelConfigKit

**下载这一份，就够配模型。**

可嵌入的 AI **模型配置知识库**。装进你的软件后，终端用户只填 **供应商 + 模型 + API Key**。端点、参数名、默认值、多模态格式由本包给出；也允许高级用户自行覆盖。

> 不是网关，不是代理。是本地可查询的配置注册表——软件据此知道该怎么调用每个模型。

English summary: [README.en.md](./README.en.md)

## 用户填什么 / 包提供什么

| 用户填写 | 本包给出 |
|----------|----------|
| 供应商 | 适配规则与默认 base URL |
| 模型 | 能力事实、限制、方向性任务（文生图 / 图生文 / TTS…） |
| API Key | 仅本地使用，不经过第三方 |

## 已适配规模

当前包内注册表约：**9900+ 模型部署 · 300+ 供应商 · 12 个适配器**（数据复用 [models.dev](https://models.dev) + [LiteLLM](https://github.com/BerriAI/litellm)）。

```bash
npx --yes github:lucasonmars/modelconfigkit stats
```

## 安装

**目前从 GitHub 安装**（尚未发布到 npm 公共源，不要写 `npm install modelconfigkit`，会 404）：

```bash
npm install github:lucasonmars/modelconfigkit
```

等价写法：

```bash
npm install lucasonmars/modelconfigkit
```

发布到 npm 之后，才会支持：

```bash
npm install modelconfigkit
```

## 三字段用法

```ts
import { loadBundledRegistry, createClient, getStats, queryModels } from "modelconfigkit";

loadBundledRegistry();
console.log(`已适配 ${getStats().model_count} 个模型部署`);

const { chatPayload } = await createClient({
  provider: "deepseek",
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  overrides: { temperature: 0.3 }, // 可选
});
```

按能力筛选：

```ts
queryModels({ task: "text-to-image" });
queryModels({ input: "image", output: "text" });
queryModels({ task: "tts" });
```

CLI：

```bash
npx --yes github:lucasonmars/modelconfigkit resolve --provider openai --model gpt-4o
npx --yes github:lucasonmars/modelconfigkit query --task text-to-image
```

## 更新机制与厂商文档

**不纳入本公开仓库同步。** 厂商文档地址与抓取管道放在私有 ops 目录。开源包保持离线可用；后续可做成订阅同步最新 overlay（见 `manifest.subscription`）。

## 许可

本仓库采用 [PolyForm Noncommercial 1.0.0](LICENSE)：**不允许商用**（个人学习、研究、非营利组织等许可范围内用途可用；商业产品/收费服务需另行授权）。

聚合进包内的上游模型元数据仍遵循各来源原有条款，见 `manifest.sources`。
