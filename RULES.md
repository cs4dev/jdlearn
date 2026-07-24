# RULES — jdlearn Harness

> Foundational constraints for any AI (or human) writing code in this repo.
> Rules are the **bottom line**, not a tutorial. They say *what must never be violated*.
> *How* to do fixed actions lives in Skills (`harness/skills/`). *Whether* the work passes
> lives in the validation script (`harness/validate.sh`).

## R1 — Definition of Done (the core gate)
A task is **not complete** on a claim of "done". It is complete only when, in order:
1. `pnpm -r typecheck` exits 0.
2. `pnpm lint` exits 0, zero warnings.
3. `pnpm test` passes 100%, zero skipped.
4. `harness/validate.sh` exits 0.
You may not report completion before all four pass. "I believe it's fine" is not completion.

## R2 — SPEC is law
`SPEC.md` (FROZEN v1) defines scope. Do not build anything outside SPEC §2. Do not silently
reinterpret it. A change to behavior requires a new SPEC version, not an edit-in-place.

## R3 — The bundle schema is the one contract
`GenerationBundle` (`packages/shared/src/bundle.ts`, Zod) is the single contract between
Claude's output, persistence, and the UI. Model output MUST `parseBundle()` successfully
before it is persisted, materialized, or returned. Invalid output is rejected. The schema
is defined exactly once — never duplicate or hand-roll a parallel shape.

## R4 — Retired (SPEC v2)
Was the demo sandbox write guard. The runnable-demo feature was dropped in SPEC v2, so
there are no demo files to confine and no guard. Rule number kept for stable numbering.

## R5 — Anthropic is server-only
`@anthropic-ai/sdk` and `ANTHROPIC_API_KEY` are used only in `packages/server`. They are
never imported or referenced in `packages/client`, and the key never appears in any tRPC
response, bundle, or shipped client asset.

## R6 — No placeholder implementations
No stubs, hardcoded demo returns, mocks-as-implementation, or `TODO: implement` bodies
presented as complete. Compiling is not implementing. A feature is built in full or
reported as NOT done. (Skeleton UI/procedures explicitly marked as a future task — e.g.
"T-001" — are not violations; faking a *done* feature is.)

## R7 — No hardcoded config or secrets
No hardcoded secrets, connection strings, or magic numbers. Config comes from env
(`packages/server/src/env.ts`, Zod-validated). No relative `.env` traversal from nested
packages — env loads from the repo root.

## R8 — Structured logging only
No bare `console.*` in production code (`no-console` is an eslint error). Use the pino
`logger` in `packages/server/src/logger.ts`. Errors wrap context. (Tests/config exempt.)

## R9 — Extensionless imports
TypeScript imports carry no `.js`/`.ts` suffix (project convention).

## R10 — Baseline honesty
"This failure was already here" is not an automatic excuse. Capture a baseline
(`harness/validate.sh --no-boot`) before changes, diff after. Any failure or warning you
introduce must be fixed before R1 passes.

## R11 — Artifact ownership (multi-agent)
A downstream role does not edit an upstream artifact (SPEC, design doc, dev-map). If an
upstream artifact is wrong, raise a blocker and route back via the PM. Every artifact has
one owner.

## R12 — Deletion is soft by default
Any feature that "deletes" user data **soft-deletes**: set a `deletedAt` timestamp, exclude
it from reads (`list`/`get` filter `deletedAt: null`), and expose a restore path. Never
`deleteOne` / `deleteMany` / `findOneAndDelete` / `.drop()` on a user-data collection unless
SPEC explicitly mandates a hard purge — and then that call carries a `// hard-delete: SPEC §X`
marker on its line. Soft-deleted records stay recoverable; "delete" never means data loss
without an explicit, SPEC-sanctioned reason.

## R13 — Standard landing + not-found pages
The web client always registers a landing route at `/` and a catch-all not-found page
(`defaultNotFoundComponent`). An unknown URL renders the 404 page — never a blank screen,
crash, or dead-end. New top-level pages are reached from existing navigation, not orphaned.
