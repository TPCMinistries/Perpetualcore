#!/bin/zsh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export PRESS_API_BASE_URL="${PRESS_API_BASE_URL:-https://perpetualcore.com}"
export PRESS_WORKER_ID="${PRESS_WORKER_ID:-press-worker-$(/bin/hostname -s)}"
export PRESS_WORKER_RECOVERY_SWEEP_MS="${PRESS_WORKER_RECOVERY_SWEEP_MS:-300000}"
export PRESS_WORKER_HEARTBEAT_MS="${PRESS_WORKER_HEARTBEAT_MS:-60000}"
export PRESS_WORKER_PROCESS_TIMEOUT_MS="${PRESS_WORKER_PROCESS_TIMEOUT_MS:-1800000}"
export PRESS_WORKER_MAX_DOWNLOAD_BYTES="${PRESS_WORKER_MAX_DOWNLOAD_BYTES:-536870912}"
export PRESS_WHISPER_COMMAND="${PRESS_WHISPER_COMMAND:-/opt/homebrew/bin/whisper}"
export PRESS_WHISPER_MODEL="${PRESS_WHISPER_MODEL:-small}"
export PRESS_WHISPER_LANGUAGE="${PRESS_WHISPER_LANGUAGE:-en}"
export PRESS_WORKER_SECRET="$(/usr/bin/security find-generic-password -a "$(/usr/bin/id -un)" -s com.perpetualcore.press-worker -w)"

SCRIPT_DIR="${0:A:h}"
REPO_ROOT="${SCRIPT_DIR:h:h}"
NODE_BIN="${PRESS_NODE_BIN:-$(command -v node)}"

if [[ ! -x "${NODE_BIN}" || ! -f "${REPO_ROOT}/node_modules/tsx/dist/cli.mjs" ]]; then
  print -u2 "Press worker cannot start: set PRESS_NODE_BIN and install repository dependencies."
  exit 1
fi

cd "${REPO_ROOT}"
exec "${NODE_BIN}" \
  "${REPO_ROOT}/node_modules/tsx/dist/cli.mjs" \
  "${REPO_ROOT}/scripts/press/queue-worker.ts"
