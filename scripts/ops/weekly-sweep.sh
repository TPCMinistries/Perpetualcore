#!/bin/bash
# Weekly ecosystem ops sweep — writes findings to the vault as canonical markdown.
# Run by launchd (com.lorenzo.ops-sweep). Manual run: bash scripts/ops/weekly-sweep.sh
set -euo pipefail
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

REPO="$HOME/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core"
LOG="$HOME/dev/LDC-Command-Center-Vault/_claude/memory/ops-findings/_sweep.log"
cd "$REPO"

{
  echo "════════ ops sweep $(date '+%Y-%m-%d %H:%M:%S') ════════"
  # PAT auto-resolves from the "Supabase Management API" keychain entry (see executor.ts)
  ./node_modules/.bin/tsx scripts/ops/run.ts rls-audit
  ./node_modules/.bin/tsx scripts/ops/run.ts revenue-probes
  # strategist runs compliance-watch in-process — no separate invocation needed
  ./node_modules/.bin/tsx scripts/ops/run.ts strategist
  # refresh the /hq dashboard snapshot now that the weekly memo is fresh
  ./node_modules/.bin/tsx scripts/ops/hq-snapshot.ts
  echo ""
} >> "$LOG" 2>&1

# Add more capabilities here as they ship:
#   ./node_modules/.bin/tsx scripts/ops/run.ts repo-sync    >> "$LOG" 2>&1
#   ./node_modules/.bin/tsx scripts/ops/run.ts deliverability >> "$LOG" 2>&1
