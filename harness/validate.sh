#!/usr/bin/env bash
# Master validation gate — the objective judge of "done" (RULES R1).
# Categories: A build/static, B tests, B2 runnable artifact, C rules-as-greps, D workflow sync.
#
# Modes:
#   (no args)  — full gate: A + B + B2 + C + D. Run by QA (and the dev on solo tasks).
#   --no-boot  — A + B + C + D. Run by the developer.
#   --static   — A + C + D only. Run by the code reviewer.
set -uo pipefail
cd "$(dirname "$0")/.."

RUN_TESTS=1; RUN_BOOT=1
case "${1:-}" in
  --static)  RUN_TESTS=0; RUN_BOOT=0 ;;
  --no-boot) RUN_BOOT=0 ;;
esac

fail=0
ok()  { printf '  ✓ %s\n' "$1"; }
bad() { printf '  ✗ %s\n' "$1"; fail=1; }

# ---- C helper: scan source only, never deps/build output ----
scan() { grep -rnE "$1" packages/*/src 2>/dev/null | grep -v node_modules | grep -v dist; }

printf '=== A. Build / static ===\n'
A_OK=1
pnpm -r typecheck >/tmp/jdlearn-tc.log 2>&1 && ok "typecheck" || { bad "typecheck (see /tmp/jdlearn-tc.log)"; A_OK=0; }
pnpm lint >/tmp/jdlearn-lint.log 2>&1 && ok "lint" || { bad "lint (see /tmp/jdlearn-lint.log)"; A_OK=0; }
pnpm build >/tmp/jdlearn-build.log 2>&1 && ok "client build" || { bad "client build (see /tmp/jdlearn-build.log)"; A_OK=0; }

if [ "$A_OK" -eq 0 ]; then
  printf '\nA failed — skipping B/B2 (noise on a broken build); still running C/D.\n'
  RUN_TESTS=0; RUN_BOOT=0
fi

if [ "$RUN_TESTS" -eq 1 ]; then
  printf '\n=== B. Tests ===\n'
  if pnpm test >/tmp/jdlearn-test.log 2>&1; then
    if grep -qiE '[1-9][0-9]* skipped' /tmp/jdlearn-test.log; then bad "tests have skips (R1: zero skipped)"; else ok "tests pass, none skipped"; fi
  else
    bad "tests (see /tmp/jdlearn-test.log)"
  fi
else
  printf '\n=== B skipped ===\n'
fi

if [ "$RUN_BOOT" -eq 1 ]; then
  printf '\n=== B2. Runnable artifact (boot + probe) ===\n'
  PORT=3111
  PORT=$PORT pnpm --filter @jdlearn/server start >/tmp/jdlearn-boot.log 2>&1 &
  SRV=$!
  up=0
  for _ in $(seq 1 30); do
    if curl -fsS "http://localhost:$PORT/api/health" >/dev/null 2>&1; then up=1; break; fi
    if ! kill -0 "$SRV" 2>/dev/null; then break; fi
    sleep 0.5
  done
  [ "$up" -eq 1 ] && ok "server boots, /api/health responds" || bad "server did not become healthy (see /tmp/jdlearn-boot.log)"
  kill "$SRV" 2>/dev/null; wait "$SRV" 2>/dev/null
else
  printf '\n=== B2 skipped ===\n'
fi

printf '\n=== C. Rules as greps ===\n'
# R5 — Anthropic server-only
grep -rnE '@anthropic-ai|ANTHROPIC_API_KEY' packages/client/src 2>/dev/null | grep -v node_modules \
  && bad "R5: Anthropic referenced in client" || ok "R5 Anthropic server-only"
# R5 — no hardcoded key literal anywhere in src
scan 'sk-ant-[A-Za-z0-9]' && bad "R5/R7: hardcoded Anthropic key literal" || ok "R7 no hardcoded key"
# R8 — no bare console in src (tests/config exempt by path)
grep -rnE 'console\.(log|error|warn|info)' packages/*/src 2>/dev/null \
  | grep -v node_modules | grep -vE '\.test\.ts|\.config\.' \
  && bad "R8: bare console in src" || ok "R8 structured logging"
# R9 — extensionless imports
scan "from ['\"]\.{1,2}/[^'\"]*\.(js|ts)['\"]" && bad "R9: extension in relative import" || ok "R9 extensionless imports"
# R6 — no placeholder stubs left in src
scan 'TODO: implement|not implemented|NotImplemented|throw new Error\(["'\'']unimplemented' \
  && bad "R6: placeholder stub in src" || ok "R6 no placeholder stubs"
# R12 — deletion is soft by default (no hard deletes on user data unless SPEC-sanctioned)
grep -rnE '\.(deleteOne|deleteMany|findOneAndDelete|drop)\(' packages/server/src 2>/dev/null \
  | grep -v node_modules | grep -v 'hard-delete' \
  && bad "R12: hard delete in server (use soft delete, or mark // hard-delete: SPEC §X)" \
  || ok "R12 soft-delete default"
# R13 — client has a landing route ("/") and a not-found page
if grep -rq 'defaultNotFoundComponent\|notFoundComponent' packages/client/src 2>/dev/null \
   && grep -rqE "path:[[:space:]]*['\"]/['\"]" packages/client/src 2>/dev/null; then
  ok "R13 landing + not-found present"
else
  bad "R13: missing landing route (path \"/\") or not-found component"
fi

printf '\n=== D. Workflow sync ===\n'
bash harness/validate-workflow.sh >/dev/null 2>&1 && ok "workflow contracts in sync" || bad "workflow sync (run harness/validate-workflow.sh)"

printf '\n'
mode_label=""
[ "$RUN_TESTS" -eq 0 ] && [ "$RUN_BOOT" -eq 0 ] && mode_label=" (static)"
[ "$RUN_TESTS" -eq 1 ] && [ "$RUN_BOOT" -eq 0 ] && mode_label=" (no-boot)"
if [ "$fail" -eq 0 ]; then printf 'VALIDATION%s: PASS\n' "$mode_label"; exit 0
else printf 'VALIDATION%s: FAIL\n' "$mode_label"; exit 1; fi
