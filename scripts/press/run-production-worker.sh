#!/bin/zsh
set -euo pipefail

export HOME="/Users/lorenzodaughtry-chambers"
export PATH="/opt/homebrew/bin:/Users/lorenzodaughtry-chambers/.local/bin:/usr/local/bin:/usr/bin:/bin"
export PRESS_API_BASE_URL="https://perpetualcore.com"
export PRESS_WORKER_ID="press-worker-lorenzo-mac"
export PRESS_WORKER_POLL_MS="5000"
export PRESS_WHISPER_COMMAND="/opt/homebrew/bin/whisper"
export PRESS_WHISPER_MODEL="small"
export PRESS_WHISPER_LANGUAGE="en"
export PRESS_WORKER_SECRET="$(/usr/bin/security find-generic-password -a lorenzodaughtry-chambers -s com.perpetualcore.press-worker -w)"

cd "/Users/lorenzodaughtry-chambers/pc-creatorstudio-wt"
exec "/Users/lorenzodaughtry-chambers/.local/bin/node" \
  "./node_modules/tsx/dist/cli.mjs" \
  "scripts/press/queue-worker.ts"
