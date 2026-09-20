# ModelConfigKit

**下载这一份，就够给你的软件接上 AI。**

当你开发带 AI 能力的软件时，你或你的用户常常要配置不同的模型厂商和模型。每家端点、参数名、默认值、多模态格式都不一样，接入又慢又容易出错，还跟不上模型更新。

**ModelConfigKit 是一个可下载的模型配置知识库。** 软件里只装这一份。用户只填 **供应商 + 模型 + API Key**，其余怎么正确调用，由本包给出——你的软件就能快速配置并调用各类模型。

> 不是网关，不是代理。是本地可查询的配置注册表。

English: [README.md](./README.md)

## 安装

**目前从 GitHub 安装**（尚未发布到 npm 时，不要用 `npm install modelconfigkit`）：

```bash
npm install github:lucasonmars/modelconfigkit
```

查看已适配规模：

```bash
npx --yes github:lucasonmars/modelconfigkit stats
```

## 用法

```ts
import { loadBundledRegistry, createClient, getStats, queryModels } from "modelconfigkit";

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
```

## 许可

[PolyForm Noncommercial 1.0.0](LICENSE)：**不允许商用**。商用需另行授权。
