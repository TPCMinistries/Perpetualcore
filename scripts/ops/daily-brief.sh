#!/bin/bash
# Daily operating brief — writes the morning brief to the vault + deck snapshot.
# Run by launchd (com.lorenzo.daily-brief) at 07:00. Manual: bash scripts/ops/daily-brief.sh
set -euo pipefail
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

REPO="$HOME/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core"
LOG="$HOME/dev/LDC-Command-Center-Vault/_claude/memory/ops-findings/_brief.log"
cd "$REPO"

{
  echo "════════ daily brief $(date '+%Y-%m-%d %H:%M:%S') ════════"
  ./node_modules/.bin/tsx scripts/ops/daily-brief.ts
  echo ""
} >> "$LOG" 2>&1
