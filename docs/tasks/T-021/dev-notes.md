# T-021 — Dev notes: async generation (durable job, non-blocking UI)

**Dev stage (full track). Implemented design.md as written; no design deviations.**
Gate: `bash harness/validate.sh --no-boot` → **VALIDATION (no-boot): PASS** (exit 0).
Individually: `pnpm -r typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (27 passed, 0 skipped),
gate 0.

## What changed and why

### Shared (`packages/shared`)
- `src/application.ts` — added `ApplicationStatus` enum (`pending|done|failed`), `status`
  (`.default("done")`), made `bundle` optional, added `error?` and `updatedAt?`. The
  `.default("done")` IS the pre-T-021 back-compat path: a legacy row (bundle, no status)
  parses as `done`. The "a done row has a bundle" invariant is enforced at **write time** by
  the worker, not by a schema refinement — refining it would reject legitimately-lenient old
  reads. `ApplicationStatus` is re-exported via the existing `export * from "./application"`
  in `src/index.ts` (no extra line needed).
- `src/application.test.ts` (new) — T5: legacy row → `done`, pending row → `bundle`
  undefined, failed row → `error` present. Frozen `GenerationBundle` untouched (R3 grep green,
  `bundle.test.ts` unchanged).

### Server (`packages/server`)
- `src/generation.ts` (new) — the ONE seam. `runGenerationJob` owns its own try/catch
  (terminal-on-throw: a thrown generation ALWAYS lands `failed`, never stuck `pending`).
  `dispatchGeneration` switches on **presence of `WORKER_FUNCTION_NAME`** (R7, NOT `NODE_ENV`
  — the gate boots `NODE_ENV=production` locally yet must take the in-process path). AWS path
  uses **dynamic** `import("@aws-sdk/client-lambda")` so the in-process path never pulls AWS
  into the module graph (A6 — local/gate needs no AWS creds).
- `src/lambda/worker.ts` (new) — async Lambda handler. Zod-validates the Event payload → seam.
- `src/repository.ts` — added `completeApplication` (status→done + bundle + updatedAt) and
  `failApplication` (status→failed + error + updatedAt). Both `updateOne` scoped to
  `{ userId, id, ...live }` so a job soft-deleted mid-flight is not resurrected; no new
  hard-delete path (R12 grep unaffected).
- `src/trpc.ts` — `generate` now: build pending `Application` → `saveApplication` (durable
  BEFORE Claude, A2) → `dispatchGeneration` → return the pending row. The request path never
  calls `generateBundle` (A1). Return type stays `Application`. `generateBundle` import kept
  (still used by `regenerateApplication`, out of scope). `getApplication`/`listApplications`
  already return rows in any status (no status filtering) — confirmed, no change needed.
- `src/env.ts` — added `WORKER_FUNCTION_NAME: z.string().default("")`.
- `esbuild.mjs` — added `worker` entrypoint; zip now includes `worker.mjs`. `@aws-sdk/*` is
  already in `external`, so `@aws-sdk/client-lambda` is NOT bundled (runtime provides it).
- `src/generation.test.ts` (new) — T1 (pending + dispatch, no `generateBundle` on request
  path), T2 (save before dispatch, ordering via `invocationCallOrder`), T3 (done + bundle
  parses), T4 (throw → failed, non-empty message, never complete), T6 (in-process path
  resolves without AWS, seam runs fire-and-forget). Mocks repo + anthropic; partial-mocks
  `./generation` (spy `dispatchGeneration`, real `runGenerationJob`); T6 pulls the real
  `dispatchGeneration` via `vi.importActual`. No Mongo.

### New devDependency
- `@aws-sdk/client-lambda` added as a **devDependency** of `packages/server` (pinned
  `^3.700.0`, pnpm resolved **3.1110.0**, installed). Dev/types-only: needed for typecheck +
  local resolution of the dynamic `import()`; it is `external` in esbuild (**zero runtime
  bytes ship** — the Node 22 Lambda runtime provides it) and never imported on the in-process
  path. Confirmed covered by the existing `@aws-sdk/*` external in `esbuild.mjs`.

### Infra (`infra/main.tf`)
- `locals.worker_function_name = "${local.name_prefix}-worker"` — fixed name used for both
  the worker's `function_name` and the HTTP Lambda's env var (provably acyclic).
- `aws_lambda_function.worker` — same zip/hash as `http`, `handler = "worker.handler"`,
  `timeout = 120`, `memory_size = 512`, shared exec role, **no Function URL**.
- `local.lambda_env` gains `WORKER_FUNCTION_NAME = local.worker_function_name`.
- `aws_iam_role_policy.invoke_worker` — grants the exec role `lambda:InvokeFunction` on the
  worker ARN (acyclic: worker depends on neither this policy nor the HTTP Lambda).

### Client (`packages/client`)
- `main.tsx` — mounted `<ToastProvider />` inside `<HeroUIProvider>` (HeroUI 2.8.10 exports
  `ToastProvider`/`addToast`; no new dep).
- `Generator.tsx` — fire→poll→toast→reconnect: `generate.onSuccess` sets `jobId` (not
  `viewing`); poll `getApplication` with `refetchInterval` 2s while `pending`; terminal effect
  (guarded once per job id) toasts + renders on `done`, toasts + surfaces an inline error
  banner + Retry on `failed`; running state gated on the polled status (`running`), not
  `generate.isPending`, so it survives a reload; reconnect effect re-seeds `jobId` from a
  `pending` row in `listApplications` on mount. Past-applications list guards `bundle`
  (label `Generating…`/`Generation failed`, open disabled for pending). Delete modal guards
  `bundle?`.
- `BundleView.tsx` — `if (!bundle) return null;` after the hooks (pending/failed apps have no
  bundle). `Generator`'s `onSaved` narrows `v.bundle` before spreading.
- `Archived.tsx` — guarded `a.bundle?.roleTitle` (+ status fallback label) and the purge
  modal's `toPurge?.bundle?.roleTitle`.

### SPEC (R2-sanctioned bump)
- `SPEC.md` v9→v10 header (FROZEN 2026-08-14), new `§0 v10 changelog — async generation`,
  updated §2 (async behavior), §3 (`Application` gains status/optional bundle/error/updatedAt),
  §5 (`generate` returns a pending Application; `getApplication`/`listApplications` any status).
  §4 frozen-bundle text and R3 untouched.

### dev-map
- Updated for `generation.ts`, `lambda/http.ts`+`lambda/worker.ts`, `completeApplication`/
  `failApplication`, `WORKER_FUNCTION_NAME`, and the `application.ts` schema entry.

## Deploy-time / manual-verify (NOT covered by the gate)
- **Terraform:** `terraform fmt` ran clean (HCL well-formed). `terraform validate` could NOT
  run in this env — installed Terraform is **1.8.4** but the config requires **>= 1.10.0**,
  and providers aren't `init`-ed. HCL is syntactically formatted; **validate + plan/apply are
  deploy-time-verify** (worker function, IAM `lambda:InvokeFunction`, `WORKER_FUNCTION_NAME`
  wiring, same-zip dual handler).
- **Real async invoke path:** the `WORKER_FUNCTION_NAME`-set branch (LambdaClient Event invoke)
  is exercised only in AWS — verify post-deploy that the HTTP Lambda invokes the worker and the
  row transitions pending→done/failed.
- **Browser toast/reconnect UX (A7):** fire → reload mid-flight → reconnect shows running then
  done; force a failure → toast + Retry. Static-verified (typecheck/lint/build); runtime UX is
  QA/manual.
- **Residual edge (design §11):** if the worker's `failApplication` write itself fails (Mongo
  unreachable) a row could remain `pending`; AWS async retries (2×) cover transient cases. A
  `pending`-reaper or SQS+DLQ is the documented upgrade path — out of scope here.

## Scope discipline
Only `generate` made async (regen = T-022). Frozen `GenerationBundle` untouched (R3). No new
runtime dependency (the SDK is dev/types-only, externalized). No bugs found outside scope.
