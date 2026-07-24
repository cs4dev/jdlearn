# T-010 — résumé-import rate limit + cheaper extraction model

**Track:** full (new persistence + frozen policy + SPEC scope change; cost/abuse control).
**SPEC:** v3.3 §4 (`canImportResume` frozen), §5, §6, §8 #12.
**Motivation:** each import calls Claude — cap cost and abuse. Two levers: rate-limit imports
and use a cheaper model for extraction (a structured-parse task doesn't need Opus).

## Scope
- **Frozen policy** `canImportResume(lastImportAt, now)` (shared/src/rate-limit.ts, pure,
  tested): one import per rolling 30-day window; returns `{ allowed, nextAllowedAt }`.
- **Persistence**: `resume_imports` collection, one doc per user (`lastImportAt`),
  `getResumeImportAt`/`setResumeImportAt` (upsert).
- **Enforcement**: `importResume` checks the gate BEFORE the Claude call (cost cap); on
  over-limit throws `TOO_MANY_REQUESTS` with the next-allowed date; records the timestamp
  only on a successful parse (a failed/invalid file doesn't burn the allowance).
- **Cheaper model**: `ANTHROPIC_EXTRACT_MODEL` env (default `claude-haiku-4-5`) used by
  `resume-parse.ts`; generation still uses `ANTHROPIC_MODEL` (Opus).

## Out of scope
Per-endpoint global rate limits, generation rate limits, configurable window UI, showing
the countdown proactively in the builder (error on attempt is enough for now).

## Acceptance (binary)
- [ ] First import allowed; a second within 30 days rejected with next-allowed date,
      BEFORE any Claude call; window resets after it passes (§8 #12, unit-tested).
- [ ] Rate-limit timestamp recorded only on successful import.
- [ ] Extraction uses `ANTHROPIC_EXTRACT_MODEL` (Haiku default); generation unchanged.
- [ ] `canImportResume` is the single policy home; R3/Resume schema unchanged.
- [ ] `harness/validate.sh` exits 0.

## Verification
Gate PASS; `canImportResume` unit-tested (boundary, within, after, first-ever). Live
per-user Mongo enforcement + the cheaper model actually being called need key + DB —
manual-verify.
