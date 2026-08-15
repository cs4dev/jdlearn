# T-021 — Code Review: async generation (durable job, non-blocking UI)

**Reviewer stage (full track). Reviewed working-tree diff (nothing committed) against
design.md + red lines. `bash harness/validate.sh --static` → VALIDATION (static): PASS
(exit 0). No boot (QA owns the full gate).**

## Verdict: APPROVE

The implementation matches design.md section-for-section. Every acceptance criterion A1–A6
(A7 manual/UX, A8 QA-boot) is implemented as specified; the red-line surface is clean.

## What I verified against the risk surface

- **A4 terminal-on-throw** (`generation.ts:23-33`): `runGenerationJob` wraps
  `getResume` + `generateBundle` + `completeApplication` in one try/catch; every throw routes
  to `failApplication` with a non-empty message. The only residual is `failApplication` itself
  failing (Mongo down) — the exact edge design §11 accepts. The pending row is always written
  (`trpc.ts:63` `await saveApplication`) BEFORE `dispatchGeneration` (`trpc.ts:64`), so a
  caught throw can never leave a row that was never persisted; a `saveApplication` throw
  surfaces as `generate.error` with no orphan row. ✔
- **A1 request path never blocks** (`trpc.ts:53-66`): `generate` does not call
  `generateBundle`; it awaits only `saveApplication` + `dispatchGeneration`. On the local path
  `dispatchGeneration` does `void runGenerationJob(job)` (`generation.ts:55`) — not awaited.
  On the Lambda path it awaits only the fast `Event` invoke. ✔
- **A6 discriminator** (`generation.ts:39-57`): switches on `env.WORKER_FUNCTION_NAME`
  (default `""`, `env.ts:27`), NOT `NODE_ENV`. `@aws-sdk/client-lambda` is a **dynamic**
  `import()` inside the `if` branch, so the in-process path never imports/constructs it and
  needs no AWS creds. B2 (NODE_ENV=production, name unset) takes the in-process path. ✔
- **A5 back-compat / R3** (`application.ts`): `status: .default("done")` + `bundle.optional()`;
  `bundle.ts` byte-for-byte unchanged (`git diff` empty). Client keys reconnect/label off
  `bundle` presence, not `status`, so legacy rows (status absent on the wire) render correctly. ✔
- **Unguarded `.bundle.` access**: grepped client+server — the only `a.bundle.roleTitle`
  (`Generator.tsx:273`) sits inside a `a.bundle ? … : …` ternary. `BundleView` guards with
  `if (!bundle) return null` after its hooks; `Archived` and the delete/purge modals use
  `?.roleTitle` with fallbacks. No runtime crash on a pending/failed row. ✔
- **R12** (`repository.ts`): `completeApplication`/`failApplication` are `updateOne` scoped to
  `{ userId, id, ...live }`; no new `deleteOne`/`drop`/`deleteMany`. The only hard-delete is
  the pre-existing annotated `purgeApplication`. R12 grep green. ✔
- **tRPC ownership**: `getApplication`/`listApplications` remain `protectedProcedure` passing
  `ctx.userId`; a pending/failed row cannot leak cross-user. ✔
- **R5/R7/R8**: Anthropic stays server-only (imported via `./anthropic` in the seam); config
  via `env.ts`; `logger.error` (pino) in the catch, no bare console. Static greps green. ✔
- **Infra** (`main.tf`): `worker` uses the shared `local.http_zip` + matching
  `source_code_hash`, `handler = "worker.handler"`, no `aws_lambda_function_url`;
  `invoke_worker` policy grants `lambda:InvokeFunction` on the worker ARN; fixed
  `local.worker_function_name` breaks any cycle; `WORKER_FUNCTION_NAME` wired into
  `local.lambda_env`. esbuild emits both entrypoints and zips `worker.mjs`; `@aws-sdk/*`
  externalized. Reads as apply-able. (terraform validate/plan is deploy-time — dev flagged it;
  not gate-blocking.) ✔
- **Tests**: T1 asserts `generateBundle` is NOT called on the request path and the returned
  app is pending/bundle-undefined (real, not vacuous). T2 asserts save-before-dispatch via
  `invocationCallOrder`. T3 runs the real seam → `completeApplication` + `parseBundle` passes.
  T4 forces a throw → `failApplication` with non-empty message, never `completeApplication`.
  T6 runs the real `dispatchGeneration` in-process and asserts the seam actually ran. T5
  covers legacy→done / pending / failed parsing. ✔

## Blocking issues

None.

## Nits (non-blocking)

1. **`generation.test.ts` T6 (A6)** verifies the in-process path *runs* but does not explicitly
   assert `@aws-sdk/client-lambda` was never imported/constructed — it relies on the branch
   guard (`WORKER_FUNCTION_NAME === ""`). The guarantee holds by construction, but a spy/mock
   proving the AWS import is unreached would make the A6 assertion literal rather than
   inferential. Optional.
2. **`Generator.tsx` reconnect race** (`:355-359` vs terminal effect): after a job completes,
   `jobId` is cleared, but until the invalidated `listApplications` refetch lands, the reconnect
   effect can momentarily re-seed `jobId` to the just-finished id. The `handledRef` guard
   prevents a duplicate toast and `running` stays false (status `done`), so this is cosmetic —
   no double generation, no double render. Consider also skipping rows already handled
   (`handledRef.current`) in the reconnect `find`.
3. **`pnpm-lock.yaml`** surfaces a deprecation note on the pre-existing `@fastify/aws-lambda@6.4.0`
   (CVE-2026-18248, fixed in 6.4.1). Not introduced by this task and out of scope, but worth a
   follow-up ticket.
