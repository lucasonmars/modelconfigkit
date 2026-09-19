#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
gh auth status
gh repo create lucasonmars/providerkit \
  --public \
  --description "Download once. Configure any model. Embeddable AI model config kit — provider + model + API key; 9000+ adapted deployments." \
  --source=. \
  --remote=origin \
  --push
gh repo edit lucasonmars/providerkit \
  --homepage "https://peoplepark.com.cn" \
  --add-topic llm \
  --add-topic model-config \
  --add-topic provider \
  --add-topic openai-compatible \
  --add-topic multimodal
echo "Done: https://github.com/lucasonmars/providerkit"
