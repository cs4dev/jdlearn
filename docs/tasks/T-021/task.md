# T-021 — async generation (durable job, non-blocking UI)

**Track:** full (new schema lifecycle + tRPC surface + infra: 2nd Lambda + IAM; touches SPEC §2/§3/§5).
**PM:** main session. **Created:** 2026-08-14.

## Raw request
Generating the cover letter + learning plan takes 20–40s. If the user closes the app or
refreshes mid-generation, the in-flight work is lost AND the Anthropic spend is wasted
(nothing reconnects to it). Want the work delegated off the request path so the UI isn't
blocked, and an in-client alert when it's done.

## Why now / root cause
Deploy target is a single HTTP Lambda + Function URL in **BUFFERED** mode behind CloudFront
(60s ceiling; Lambda timeout 60s — `infra/main.tf:85`). `generate` (`packages/server/src/
trpc.ts:48`) runs `generateBundle` **inside** the request and `saveApplication`s only at the
very end. On Lambda you can't return early and keep working — the handler freezes on return.
So a refresh drops the only client holding the result, and there's no job id to reconnect by.
Generations near/over 60s are also hard-killed → paid-for, lost.

## Decisions already made by PM (do not re-litigate — design within these)
1. **Async mechanism = async worker Lambda (self-zip), NOT SQS.** `generate` persists a
   `pending` job, fires `InvocationType: "Event"` at a second Lambda function that ships the
   SAME esbuild zip (different handler export), then returns the job id immediately. The
   worker runs `generateBundle` and writes `done`/`failed` to Mongo. Rationale: same
   durability + auto-retry (Event invokes retry 2×) as SQS for one IAM statement + one
   handler, no queue/DLQ/event-source-mapping to own. `@aws-sdk/*` is already on the Lambda
   runtime and externalized in `esbuild.mjs` — **no new npm dependency.** SQS is the
   documented upgrade path if concurrency/throttling ever demands it (note it in design).
2. **Notification = in-app poll + toast, NOT web push.** Client polls the job via TanStack
   Query `refetchInterval` until terminal, then toasts + renders. On reload it resumes
   polling any non-terminal job. No service worker / VAPID / subscription store. Closed-tab
   web push is explicitly out of scope (note as upgrade path).

## In scope
- Async job lifecycle for **generation** (the `generate` mutation). `pending → done | failed`.
- Durable: the job row exists before Claude is called; result written by the worker.
- Non-blocking `generate` (returns an id/handle immediately, not the finished bundle).
- Client: fire-and-poll UX, toast on completion, reconnect-on-reload to in-flight jobs.
- Infra: 2nd Lambda (worker) from the same zip + IAM to let the HTTP Lambda `Event`-invoke it.
- SPEC bump v9→v10 (§2 behavior, §3 data, §5 API); env/infra note if new vars.

## Out of scope (state explicitly)
- SQS / DLQ (upgrade path only).
- Web/OS push notifications, service workers (upgrade path only).
- Applying the same async pattern to `regenerateApplication` / résumé `importResume` — this
  task covers `generate` only; regen can follow as T-022 reusing the mechanism if wanted.
- Any change to the frozen `GenerationBundle` schema (RULES R3 — bundle shape unchanged).
- Local-dev parity beyond "it works": local (non-Lambda) has no 2nd function; design must
  specify how `generate` runs the worker locally (e.g. in-process async) so the gate's B2
  boot + `pnpm dev` still function without AWS.

## Design must resolve (hand-offs the architect owns)
- **Data model:** `Application` currently *requires* `bundle` (`packages/shared/src/
  application.ts`). Async needs a row that exists pre-bundle. Choose: add `status` +
  make `bundle` optional-until-done on `Application`, OR a separate `Job` row the app
  is created from. Must stay backward-compatible — every existing stored row has a `bundle`
  and no `status` (treat missing `status` as `done`). Keep it ONE schema home (R3 spirit).
- **tRPC surface (§5):** how `generate` returns (job id vs a pending Application), and the
  poll procedure (`getJob`/reuse `getApplication`). Owner-scoped, server-authoritative.
- **Worker invocation seam:** one code path that both the async Lambda and local dev call.
  Lambda: `lambda.invoke(Event)` → `worker.handler` → that seam. Local: same seam invoked
  in-process (don't block the response — fire it, let it resolve). Errors → `status:failed`
  with a message the client can show; never leave a job stuck `pending` on a crash (worker
  retry + a terminal-on-throw guard).
- **esbuild:** add the `worker` entrypoint to the bundle/zip alongside `http`.
- **infra:** `aws_lambda_function` (worker, same zip, `handler = "worker.handler"`, longer
  timeout for the 20–40s Claude call, NO Function URL), + IAM allowing the exec role
  `lambda:InvokeFunction` on the worker. Env: pass the worker function name to the HTTP
  Lambda (e.g. `WORKER_FUNCTION_NAME`) via `env.ts` (R7) + `lambda_env`.
- **Failure/stuck handling:** what the client shows on `failed`; retry affordance.

## Acceptance (architect makes each binary in design.md)
Draft — refine into pass/fail criteria:
1. `generate` returns without waiting for Claude (response time ≪ generation time).
2. A job row is persisted with `status: pending` BEFORE Claude is called.
3. Refresh/close mid-generation then reload → the client reconnects and shows the running
   job, and the finished bundle once done. No duplicate generation, no double spend.
4. Worker failure → job ends `failed` with a message; never stuck `pending`.
5. Existing pre-T-021 stored applications still `parseApplication`/render (missing `status`
   ⇒ treated as `done`). Frozen `GenerationBundle` unchanged (R3 grep green).
6. Local `pnpm dev` + gate B2 boot work with no AWS (in-process worker seam).
7. Full gate `VALIDATION: PASS`; typecheck/lint/test/gate all exit 0 (R1).

## Routing log
- 2026-08-14 — PM: created, track=full, product forks resolved (async worker Lambda +
  in-app poll/toast). Next: design (solution-architect).
- 2026-08-14 — design ✓ (`design.md`, all-green readiness). User approved the design incl. the
  dev-only `@aws-sdk/client-lambda` dep. Next: dev.
- 2026-08-14 — dev ✓ (`dev-notes.md`, no deviations, `--no-boot` gate exit 0). Next: review ∥ qa.
- 2026-08-14 — review ✓ **APPROVE** (0 blocking, 3 nits) + qa ✓ **PASS** (full gate
  `VALIDATION: PASS`, 27 tests). **DONE** (R1 satisfied). Nits + A7/Terraform/AWS left as
  deploy-time/manual-verify (see board + qa.md).
</content>
</invoke>
