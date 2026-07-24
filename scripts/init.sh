#!/usr/bin/env bash
# Idempotent local setup: Mongo up, .env present, deps installed. Safe to re-run.
set -uo pipefail
cd "$(dirname "$0")/.."

# 1. .env from example if absent
[ -f .env ] || { cp .env.example .env; echo "created .env (set ANTHROPIC_API_KEY for generation)"; }

# 2. Mongo via docker (single container; no compose file needed)
if command -v docker >/dev/null 2>&1; then
  if ! docker ps --format '{{.Names}}' | grep -q '^jdlearn-mongo$'; then
    if docker ps -a --format '{{.Names}}' | grep -q '^jdlearn-mongo$'; then
      docker start jdlearn-mongo >/dev/null
    else
      docker run -d --name jdlearn-mongo -p 27017:27017 mongo:8 >/dev/null
    fi
    echo "mongo started (jdlearn-mongo on :27017)"
  else
    echo "mongo already running"
  fi
else
  echo "docker not found — start MongoDB yourself or set MONGO_URL" >&2
fi

# 3. deps
command -v pnpm >/dev/null 2>&1 && pnpm install || echo "pnpm not found — install pnpm" >&2

echo "init done."
