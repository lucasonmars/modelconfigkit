#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
gh auth status
gh repo create lucasonmars/modelconfigkit \
  --public \
  --description "Download once. Configure any model. Users fill provider + model + API key; ModelConfigKit supplies endpoints, params, and multimodal formats. 9000+ adapted deployments." \
  --source=. \
  --remote=origin \
  --push
gh repo edit lucasonmars/modelconfigkit \
  --homepage "https://peoplepark.com.cn" \
  --add-topic llm \
  --add-topic model-config \
  --add-topic provider \
  --add-topic openai-compatible \
  --add-topic multimodal
echo "Done: https://github.com/lucasonmars/modelconfigkit"
