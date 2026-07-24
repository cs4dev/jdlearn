# T-001 — JD → bundle generation pipeline

**Raw request:** "T-001" — build the generation pipeline from the planned board entry:
Better Auth session → Claude call (stack-from-JD prompt) → `parseBundle()` →
`materializeDemo()` → persist `Application` in Mongo; plus `listApplications` /
`getApplication`, the Home generate button, and the missing-API-key error path.

**Track:** full — new external integration (Anthropic) + touches the correctness core
(R3 schema, R4 sandbox). Server is the authority (SPEC §5).

**Workflow:** `harness/workflow/workflow.yaml` · **Artifacts:** this folder.

## Scope (acceptance §8 #1–3, #8–11)
- Server: `anthropic.ts` (generateBundle via forced tool use; missing-key → clear error),
  `repository.ts` (save/list/get Applications), `trpc.ts` (session context,
  `protectedProcedure`, `generate`/`listApplications`/`getApplication`), `index.ts`
  (mount Better Auth at `/api/auth/*`).
- Shared: `Application` schema.
- Client: auth gate (email+password), generate form, render bundle, past-apps list.
- Test: `generateBundle` rejects with no API key (no network) — acceptance #8.

## Out (separate tasks)
- T-002 demo file browser + zip download (#4–6 download). #4/#5 (sandbox) already
  enforced + tested in the frozen core.
- T-003 richer history UI.

## PM routing log
| # | Stage | Agent | Start | End | Verdict | Note |
|---|-------|-------|-------|-----|---------|------|
| 1 | dev | developer (main) | — | — | done | server (anthropic/repo/trpc/auth-mount) + client (auth gate, generator, bundle view) |
| 2 | qa | full gate | — | — | PASS | typecheck·lint·build·tests·boot·greps·workflow all green |
| 3 | review | code-reviewer (sub) | — | — | PASS w/ fix | found missing trustedOrigins (Better Auth 403 on split dev port); fixed via env.TRUSTED_ORIGINS. Cookies/forwarding/ordering cleared. |

## Outcome
DONE. Generate pipeline live-ready: needs `ANTHROPIC_API_KEY` + running Mongo (`scripts/init.sh`).
Reviewer fix applied: `trustedOrigins` from `TRUSTED_ORIGINS` env (default web :5173).
Not gate-verified (no key/DB/browser at gate time): live Claude generation + sign-in round-trip — verify manually.
