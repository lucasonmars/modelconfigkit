# ModelConfigKit

**下载这一份，就够配模型。**

可嵌入的 AI **模型配置知识库**。装进你的软件后，终端用户只填 **供应商 + 模型 + API Key**。端点、参数名、默认值、多模态格式由本包给出；也允许高级用户自行覆盖。

> 不是网关，不是代理。是本地可查询的配置注册表——软件据此知道该怎么调用每个模型。

## 用户填什么 / 包提供什么

| 用户填写 | 本包给出 |
|----------|----------|
| 供应商 | 适配规则与默认 base URL |
| 模型 | 能力事实、限制、方向性任务（文生图 / 图生文 / TTS…） |
| API Key | 仅本地使用，不经过第三方 |

那些讨厌的参数差异（`max_tokens` vs `max_completion_tokens`、是否支持 `top_k`、图片用 `image_url` 还是 `inline_data`）都有默认与映射。

## 已适配规模

```bash
npx modelconfigkit stats
```

当前包内注册表约：**9900+ 模型部署 · 300+ 供应商 · 12 个适配器**（数据复用 models.dev + LiteLLM）。

## 安装

```bash
npm install modelconfigkit
```

## 三字段用法

```ts
import { loadBundledRegistry, createClient, getStats } from "modelconfigkit";

loadBundledRegistry();
console.log(`已适配 ${getStats().model_count} 个模型部署`);

const { chatPayload } = await createClient({
  provider: "deepseek",
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
});
```

按能力筛选：

```ts
queryModels({ task: "text-to-image" });
queryModels({ input: "image", output: "text" });
queryModels({ task: "tts" });
```

## 更新机制与厂商文档

**不纳入本公开仓库同步。** 厂商文档地址与抓取管道放在私有 ops 目录。开源包保持离线可用；后续可做成订阅同步最新 overlay（见 `manifest.subscription`）。

## 许可

- 代码：MIT
- 聚合数据：遵循上游条款，来源见 `manifest.sources`
