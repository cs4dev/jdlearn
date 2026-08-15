# T-021 — QA report: async generation (durable job, non-blocking UI)

**QA stage (full track). Owns the SINGLE full boot gate (B2). Reviewer runs static-only in parallel.**
**Date:** 2026-08-14 · **Verdict:** **PASS**

---

## 1. Objective gate (R1 — the judge of done)

| Command | Exit | Notes |
|---|---|---|
| `pnpm -r typecheck` | **0** | shared + server + client all `Done`. |
| `pnpm lint` | **0** | `eslint .` clean. |
| `pnpm test` | **0** | **27 passed, 0 skipped** (6 files). |
| `bash harness/validate.sh` (FULL, WITH boot — the one boot for the task) | **0** | `VALIDATION: PASS`. |

### `validate.sh` result line
```
VALIDATION: PASS
```

Gate sections all green: A build/static (typecheck, lint, client build), B tests (none skipped),
**B2 runnable artifact (`✓ server boots, /api/health responds`)**, C rules-as-greps
(R5/R7/R8/R9/R6/R12/R13), D workflow sync.

**B2 boot took the in-process seam correctly:** `WORKER_FUNCTION_NAME` is **unset** locally
(confirmed `WFN=[unset]`), so `dispatchGeneration` runs `void runGenerationJob(job)` in-process —
no `@aws-sdk/client-lambda` import, no LambdaClient construction, no AWS creds. Server booted and
`/api/health` responded. (A6, A8.)

---

## 2. Acceptance criteria

| # | Criterion | Result | How verified |
|---|---|---|---|
| A1 | `generate` never `await generateBundle` on request path | **MET (test + code)** | `trpc.ts` generate builds pending row → `saveApplication` → `dispatchGeneration` → returns; no `generateBundle` on that path (line 77 `generateBundle` is `regenerateApplication`, out of scope). Test T1 asserts `generateBundle` **not** called and returned app is `pending` with no bundle. Not vacuous. |
| A2 | Pending row (`status:"pending"`, no bundle) persisted **before** Claude | **MET (test + code)** | Test T2 asserts `saveApplication` called with `status:"pending"`, `bundle` undefined, AND `saveApplication.invocationCallOrder < dispatchGeneration.invocationCallOrder`. Real ordering asserted, not vacuous. |
| A3 | Worker success → `status:"done"` + schema-valid bundle | **MET (test)** | Test T3: `runGenerationJob` w/ mocked `generateBundle` calls `completeApplication(u,id,bundle)`, `failApplication` NOT called, and `parseBundle(written)` does not throw (R3). |
| A4 | Throw → `status:"failed"` + non-empty error, never left pending; never `completeApplication` | **MET (test)** | Test T4: `generateBundle` rejects → `failApplication` called once with truthy non-empty message, `completeApplication` NOT called. `generation.ts` try/catch confirms terminal-on-throw. |
| A5 | Legacy row (bundle, no status) parses as `done`; pending row has `bundle` undefined; frozen `bundle.ts` byte-unchanged | **MET (test + git)** | `application.test.ts`: legacy row → `status==="done"`; pending row → `bundle` undefined; failed row → `error` present; enum is exactly `[pending,done,failed]`. `git diff --stat packages/shared/src/bundle.ts` = **empty** (not in `git status`); `bundle.test.ts` still green (8 tests). |
| A6 | `WORKER_FUNCTION_NAME` unset → in-process, no AWS client/creds; `pnpm dev`/B2 boot succeed | **MET (test + gate)** | Test T6 pulls the REAL `dispatchGeneration` via `importActual`, asserts it resolves without AWS and the seam completes the row in-process. B2 boot succeeded with `WORKER_FUNCTION_NAME` unset. `import("@aws-sdk/client-lambda")` is dynamic, inside the `if (env.WORKER_FUNCTION_NAME)` branch only. |
| A7 | Client fire→poll→toast→reconnect; failed→retry | **MET wiring / MANUAL runtime** | Wiring present (see §3). Runtime UX is manual-verify (needs real key/DB/browser). |
| A8 | Full gate PASS; 4 commands exit 0 | **MET (gate)** | See §1 — all four exit 0, `VALIDATION: PASS`. |

---

## 3. A7 — manual-verify (wiring confirmed present, runtime UX needs a human)

Not gate-coverable (needs a real Anthropic key, live Mongo, and a browser). Code paths all exist:
- **Toast provider mount:** `main.tsx:12` imports `ToastProvider`, `main.tsx:55` mounts `<ToastProvider />` inside `<HeroUIProvider>`.
- **Poll wiring:** `Generator.tsx` polls `trpc.getApplication.useQuery({id: jobId})` with `refetchInterval` = 2000ms while `status==="pending"`, else false.
- **Terminal toasts:** effect keyed on `job.data` — `done` → success toast + `setViewing` + clear jobId; `failed` → danger toast + clears jobId; guarded once-per-job via `handledRef`.
- **Reconnect on reload:** effect re-seeds `jobId` from a `pending` row in `listApplications` when not already tracking.
- **Retry affordance:** failed banner + "Try again" buttons (`Generator.tsx:202,215`).
- **Bundle guards:** `BundleView.tsx` returns null when no bundle; past-list + `Archived.tsx` label `Generating…`/`Generation failed` and guard `a.bundle?.roleTitle`.

**Human must click:** (1) paste a JD, fire → running state shows; (2) reload mid-flight → reconnects, shows running then the finished bundle + success toast; (3) force a failure (e.g. bad/no key) → failed row + danger toast + working "Try again" re-fires a new pending job.

Per the frozen design (§3 A7, §10, §12) and dev-notes, A7 runtime is explicitly manual — NOT a fail cause. Wiring is present, so no fail on absence.

---

## 4. Checks that could not run (reported, not skipped)

- **Terraform `validate`/`plan`** (infra worker Lambda + IAM `lambda:InvokeFunction` + `WORKER_FUNCTION_NAME` wiring): deploy-time only — installed Terraform 1.8.4 < required 1.10.0, providers not init-ed. Not part of `harness/validate.sh`; out of the gate's scope. Deploy-time verify.
- **Real async Lambda invoke path** (`WORKER_FUNCTION_NAME` set → LambdaClient Event invoke): exercised only in AWS. Post-deploy verify.

Neither is a gate check; no gate check was skipped.

---

## 5. Verdict

**PASS.** All four gate commands exit 0, `VALIDATION: PASS` with the single B2 boot succeeding on
the in-process seam (no AWS). Every statically/unit-checkable acceptance criterion (A1–A6, A8) is
met by non-vacuous tests and/or the gate; A5 back-compat proven and frozen `bundle.ts` byte-for-byte
unchanged. A7 wiring is present; its runtime UX remains manual-verify as the frozen design intended.
