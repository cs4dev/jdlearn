# T-021 — Design: async generation (durable job, non-blocking UI)

**Track:** full · **Author:** solution-architect · **Date:** 2026-08-14
**Reads:** task.md (PM decisions are settled — async worker Lambda + in-app poll/toast),
SPEC v9 (§2/§3/§4/§5), RULES (R1/R2/R3/R5/R7/R8/R12), dev-map.

---

## 1. Problem statement

`generate` runs `generateBundle` (a 20–40s Anthropic call) **inside** the tRPC request and
only `saveApplication`s at the very end (`packages/server/src/trpc.ts:48`). On the deploy
target — one HTTP Lambda + Function URL in BUFFERED mode behind CloudFront (60s ceiling,
`infra/main.tf:85`) — the handler cannot return early and keep working, so a mid-generation
refresh/close drops the only client holding the result and wastes the Anthropic spend; runs
near/over 60s are hard-killed. This task moves the Claude call **off the request path** onto a
durable, per-user job: `generate` persists a `pending` application row, dispatches the work to
a second Lambda (async `Event` invoke of the SAME esbuild zip, different handler), and returns
immediately. The worker writes `done`/`failed` to Mongo. The client fires, polls, toasts on
completion, and reconnects to an in-flight job on reload. Locally (no AWS) the same worker seam
runs in-process, fire-and-forget.

## 2. Scope

**In:**
- Async job lifecycle for the `generate` mutation only: `pending → done | failed`.
- Durable job row persisted **before** Claude is called; result written by the worker.
- Non-blocking `generate` (returns the pending `Application`, not the finished bundle).
- Client: fire → poll (TanStack `refetchInterval`) → toast on terminal → render; reconnect to
  any non-terminal job on reload.
- Worker seam: ONE function both the async Lambda handler and local dev call.
- Infra: 2nd Lambda (`worker`, same zip, `handler = "worker.handler"`, no Function URL) + IAM
  `lambda:InvokeFunction` + `WORKER_FUNCTION_NAME` wired through `env.ts` and `lambda_env`.
- SPEC bump **v9 → v10** (dev owns the edit): changed sections §0 (new changelog), §2, §3, §5.

**Out (explicit):**
- SQS / DLQ — documented upgrade path only (see §11).
- Web/OS push, service workers, VAPID — upgrade path only.
- Applying async to `regenerateApplication` / `importResume` — `generate` only (regen ⇒ T-022).
- Any change to the frozen `GenerationBundle` schema (`packages/shared/src/bundle.ts`) — R3.
- Full local Lambda emulation — local uses the in-process seam; no 2nd function locally.

## 3. Acceptance criteria (binary)

- **A1** `generate` returns a response whose latency is dominated by a Mongo insert, not the
  Claude call: it does **not** `await generateBundle` on the request path. (Test T1 asserts the
  request path never calls `generateBundle`.)
- **A2** Before any Claude call, a row exists in `applications` with `status: "pending"` and no
  `bundle`. (Test T2.)
- **A3** After the worker seam completes successfully, the row has `status: "done"` and a
  `bundle` that parses against the frozen schema; `getApplication` returns it. (Test T3.)
- **A4** If `generateBundle` (or the seam) throws, the row ends `status: "failed"` with a
  non-empty `error` string; it is **never** left `pending` for a caught throw. (Test T4.)
- **A5** A stored pre-T-021 application (has `bundle`, no `status`) parses via `Application`
  and is treated as `done`; the frozen `GenerationBundle` is byte-for-byte unchanged (R3 grep
  green). (Test T5.)
- **A6** With `WORKER_FUNCTION_NAME` unset (local/dev/gate), `dispatchGeneration` runs the seam
  **in-process** without importing/constructing any AWS client and without AWS credentials;
  `pnpm dev` and the gate's B2 boot succeed. (Test T6.)
- **A7** Client: after firing, the UI shows a running state; on reload it reconnects (via a
  `pending` row surfaced by `listApplications` / a polled `getApplication`) and shows the
  finished bundle once `done`; a `failed` job shows an error + retry affordance. (Manual/UX,
  see §10.)
- **A8** Full gate `VALIDATION: PASS`; `pnpm -r typecheck`, `pnpm lint`, `pnpm test`, and
  `bash harness/validate.sh` all exit 0 (R1).

## 4. Data model — `Application` (single schema home, R3 spirit)

Keep ONE schema in `packages/shared/src/application.ts`. Add a `status`, make `bundle`
optional-until-done, add an `error` message. No separate `Job` row (avoids a second collection,
a second owner-scoping surface, and a join; the application row IS the job).

```ts
// packages/shared/src/application.ts
import { z } from "zod";
import { GenerationBundle } from "./bundle";

export const ApplicationStatus = z.enum(["pending", "done", "failed"]);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

export const Application = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  jdText: z.string().min(1),
  // Missing on every pre-T-021 row ⇒ treated as "done" (back-compat, A5).
  status: ApplicationStatus.default("done"),
  // Optional-until-done: a pending row has no bundle yet. A done row has one
  // (enforced by the worker at write time, not by the schema, so old rows stay lenient).
  bundle: GenerationBundle.optional(),
  // Set only when status === "failed": a short message the client can show.
  error: z.string().optional(),
  createdAt: z.string(), // ISO 8601
  updatedAt: z.string().optional(), // ISO 8601 — stamped when the worker writes a terminal state
  deletedAt: z.string().nullish(),
});
export type Application = z.infer<typeof Application>;
```

Notes:
- `.default("done")` makes Zod fill `status` when the key is absent — this is exactly the
  pre-T-021 back-compat path (A5). New rows always set `status` explicitly.
- `bundle` optional keeps old rows valid and lets a `pending` row exist pre-bundle. The
  invariant "a `done` row has a `bundle`" is a **write-time** guarantee (§6), not a schema
  refinement — refining it would reject legitimately-lenient reads and complicate the type the
  client consumes.
- Export `ApplicationStatus` from `packages/shared/src/index.ts` alongside `Application`.

## 5. tRPC surface (§5) — `packages/server/src/trpc.ts`

- **`generate`** (changed) — protected mutation, input unchanged `{ jdText }`, **return type
  unchanged: `Application`** — but now the *pending* application (status `pending`, no
  `bundle`). Behavior:
  1. `id = randomUUID()`, build `app: Application = { id, userId, jdText, status: "pending",
     createdAt }`.
  2. `await saveApplication(app)` (durable BEFORE Claude — A2).
  3. `dispatchGeneration({ userId: ctx.userId, appId: id, jdText: input.jdText })` — **not
     awaited past the dispatch** (Lambda `Event` invoke resolves fast; local fire-and-forget).
  4. `return app` (the pending row) — the client polls by `app.id`.
  The request path never calls `generateBundle` (A1).
- **Poll = reuse `getApplication`** (no new `getJob`). It is already protected, owner-scoped,
  and live-only; it now returns rows in any status. The client polls
  `getApplication({ id })` until `status` is terminal. Ownership + server authority preserved.
- **`listApplications`** (unchanged signature) now also returns `pending`/`failed` rows so a
  reloaded client can reconnect to an in-flight job (A7). The UI guards `bundle` presence.
- `regenerateApplication`, `updateCoverLetter`, etc. — **unchanged** (out of scope).

## 6. Worker seam + dispatch — `packages/server/src/generation.ts` (new)

New module `packages/server/src/generation.ts` (server layer per dev-map; keeps `trpc.ts` thin
and gives the Lambda handler a dependency-free import). Two exports:

```ts
// The ONE seam both the Lambda handler and local dev call.
export interface GenerationJob { userId: string; appId: string; jdText: string; }

export async function runGenerationJob(job: GenerationJob): Promise<void> {
  try {
    const resume = await getResume(job.userId);
    const bundle = await generateBundle(job.jdText, resume); // may throw (no key, model, network)
    await completeApplication(job.userId, job.appId, bundle); // status → done + bundle + updatedAt
  } catch (err) {
    // Terminal-on-throw guard (A4): a thrown/crashed generation ALWAYS lands failed,
    // never stuck pending. Message is user-facing but scrubbed of internals.
    const message = err instanceof Error ? err.message : "Generation failed.";
    logger.error({ err, appId: job.appId }, "generation job failed"); // R8 pino, no bare console
    await failApplication(job.userId, job.appId, message); // status → failed + error + updatedAt
  }
}

// Fires the seam off the request path. Discriminator = presence of WORKER_FUNCTION_NAME (R7).
export async function dispatchGeneration(job: GenerationJob): Promise<void> {
  if (env.WORKER_FUNCTION_NAME) {
    // Lambda path: async Event invoke of the worker function. @aws-sdk/client-lambda is on the
    // Node 22 runtime and externalized in esbuild (never shipped). Construct only here.
    const { LambdaClient, InvokeCommand } = await import("@aws-sdk/client-lambda");
    const client = new LambdaClient({});
    await client.send(new InvokeCommand({
      FunctionName: env.WORKER_FUNCTION_NAME,
      InvocationType: "Event", // async; AWS retries a failed async invoke 2× on its own
      Payload: Buffer.from(JSON.stringify(job)),
    }));
  } else {
    // Local/dev/gate path: run in-process, fire-and-forget. Do NOT await before responding.
    void runGenerationJob(job);
  }
}
```

**Discriminator:** presence of `WORKER_FUNCTION_NAME` (empty string default ⇒ in-process). This
is a data-driven switch (R7), not `NODE_ENV` — the gate's B2 boot runs `NODE_ENV=production`
locally yet must take the in-process path, so `NODE_ENV` would be wrong.

**Why dynamic `import("@aws-sdk/client-lambda")`:** keeps the AWS client out of the module graph
on the in-process path so local `tsx`/B2 boot never touches AWS (A6). See §8 for the dev-only
dependency this requires.

**Lambda handler — `packages/server/src/lambda/worker.ts` (new):**

```ts
import { z } from "zod";
import { runGenerationJob } from "../generation";

const Job = z.object({ userId: z.string().min(1), appId: z.string().min(1), jdText: z.string().min(1) });

export const handler = async (event: unknown): Promise<void> => {
  const job = Job.parse(event); // async Event payload is the JSON we sent; validate it
  await runGenerationJob(job);  // seam owns its own try/catch → terminal-on-throw
};
```

If `runGenerationJob` returns normally, the async invoke succeeds. If the handler *throws*
(e.g. `failApplication` itself fails because Mongo is down — the rare case the row could stay
pending), AWS retries the async invoke up to 2×; that is the durability backstop the PM chose
over SQS. Note this residual edge in §11.

**Repository changes — `packages/server/src/repository.ts`:**
- `saveApplication(app)` — unchanged; now inserts a pending row (bundle omitted). Type already
  fits (bundle optional).
- **`completeApplication(userId, id, bundle): Promise<boolean>`** — `updateOne({ userId, id,
  ...live }, { $set: { status: "done", bundle, updatedAt: now } })`; returns `matchedCount === 1`.
- **`failApplication(userId, id, error): Promise<boolean>`** — `updateOne({ userId, id,
  ...live }, { $set: { status: "failed", error, updatedAt: now } })`.
- Both scope to `...live` (owner + not soft-deleted) — a deleted-mid-flight job is not
  resurrected. No `.deleteOne`/`.drop` added, so the R12 hard-delete grep stays green.

## 7. esbuild — `packages/server/esbuild.mjs`

Add the worker entrypoint and include it in the single zip both Lambdas share:

```js
entryPoints: { http: "src/lambda/http.ts", worker: "src/lambda/worker.ts" },
// ...
execSync(`cd ${outdir} && zip -q http.zip http.mjs worker.mjs`, { stdio: "inherit" });
```

`@aws-sdk/*` is already in `external` (line 25) so `@aws-sdk/client-lambda` is not bundled — the
worker uses the runtime copy. One zip (`http.zip`) contains both handlers; both Lambda resources
point at it with the same `source_code_hash`.

## 8. Config — `packages/server/src/env.ts` (R7)

Add one var with a local default that selects the in-process path:

```ts
// Name of the worker Lambda for async Event invokes. Empty (local/dev/gate) ⇒ run the
// generation seam in-process instead. Set only in the deployed HTTP Lambda's env.
WORKER_FUNCTION_NAME: z.string().default(""),
```

**Dependency to add (call-out):** `@aws-sdk/client-lambda` as a **devDependency** of
`packages/server`. Justification: it is needed for TypeScript types (typecheck) and for local
resolution of the dynamic `import()`; it is `external` in esbuild so **zero runtime bytes ship**
(the Node 22 Lambda runtime provides it), and it is never imported on the in-process path. This
honors the PM's "no new *runtime* npm dependency" — it is dev/types-only. This is the only new
package. (Alternative considered: a hand-written type shim to avoid the devDep entirely —
rejected as more fragile than a pinned, dev-only, never-shipped SDK package already present on
the target runtime.)

## 9. Infra — `infra/main.tf` + `infra/variables.tf`

- **`locals.worker_function_name = "${local.name_prefix}-worker"`** — a fixed name used for BOTH
  the worker resource's `function_name` AND the HTTP Lambda's env var, so there is provably no
  resource-reference cycle regardless of ordering.
- **`aws_lambda_function.worker`:** same `filename`/`source_code_hash` as `http` (the shared
  `local.http_zip`), `handler = "worker.handler"`, `runtime = "nodejs22.x"`,
  `function_name = local.worker_function_name`, `role = aws_iam_role.lambda_exec.arn` (shared
  exec role), `memory_size = 512`, `timeout = 120` (headroom over the 20–40s Claude call; async
  invoke is not bound by the 60s CloudFront/Function-URL ceiling), `environment { variables =
  local.lambda_env }`. **No `aws_lambda_function_url`** for the worker.
- **`local.lambda_env`:** add `WORKER_FUNCTION_NAME = local.worker_function_name` (so the HTTP
  Lambda takes the async path in prod). The worker also receives this var harmlessly; it never
  invokes itself.
- **IAM — allow the HTTP Lambda to invoke the worker:** new `aws_iam_role_policy` on
  `aws_iam_role.lambda_exec` granting `Action = "lambda:InvokeFunction"`,
  `Resource = aws_lambda_function.worker.arn`. (The worker resource doesn't depend on this
  policy or on the HTTP Lambda, so referencing its ARN is acyclic.)
- No change to CloudFront, Function URL, or the HTTP Lambda's 60s timeout (its request path no
  longer blocks on Claude, but the value is left as-is — out of scope to retune).

## 10. Client — fire → poll → toast → reconnect

Files: `packages/client/src/Generator.tsx` (the flow), `packages/client/src/main.tsx` (mount the
toast provider once). **No new dependency** — the installed HeroUI (2.8.10) exports
`addToast` + `ToastProvider` (verified in `node_modules/@heroui/react`).

- **main.tsx:** add `<ToastProvider />` once inside `<HeroUIProvider>` (HeroUI's documented
  placement). Import `ToastProvider` from `@heroui/react`.
- **Generator.tsx:**
  - Track the in-flight job by id: `const [jobId, setJobId] = useState<string | null>(null)`.
  - `generate.useMutation({ onSuccess: (app) => { setJobId(app.id); utils.listApplications.invalidate(); } })`
    — `app` is now the pending row; do **not** `setViewing(app)` yet (no bundle).
  - Poll with `getApplication`:
    `const job = trpc.getApplication.useQuery({ id: jobId! }, { enabled: !!jobId, refetchInterval: (q) => { const s = q.state.data?.status; return s === "pending" ? 2000 : false; } })`.
    (2s interval; stops polling on any terminal status — `undefined`/`done`/`failed`.)
  - On terminal transition (effect keyed on `job.data?.status`): if `done` →
    `addToast({ title: "Your application is ready", color: "success" })`, `setViewing(job.data)`,
    clear `jobId`, invalidate `listApplications`. If `failed` →
    `addToast({ title: "Generation failed", description: job.data.error, color: "danger" })`,
    surface the error inline with a **Retry** button that re-fires `generate.mutate({ jdText })`
    (using the row's `jdText`), clear `jobId`.
  - **Running state:** keep the existing `BundleSkeleton` + `GeneratingStatus`, now gated on
    `!!jobId && job.data?.status === "pending"` instead of `generate.isPending`, so it survives
    a reload.
  - **Reconnect on reload:** on mount, if `listApplications` returns a row with
    `status === "pending"`, `setJobId(thatRow.id)` to resume polling (A7). No duplicate
    generation — the worker owns the single in-flight job; the client only observes it.
  - **Past applications list:** rows may now be `pending`/`failed` with no `bundle` — guard
    `a.bundle?.roleTitle` with a fallback label (`"Generating…"` for pending, `"Generation
    failed"` for failed) and disable "open" for pending rows.
- **trpc.ts (client):** no change — `AppRouter` type flows automatically.

**Failure UX (A7):** a `failed` job renders the existing danger banner (reused from the current
`generate.error` block) showing `job.data.error` plus a **Try again** button; the toast mirrors
it. Retry issues a fresh `generate` (new pending row) — the old failed row stays in history until
the user deletes it.

## 11. Backward-compatibility & upgrade paths

- **Stored rows:** every pre-T-021 row has a `bundle` and no `status`; `Application`'s
  `status: .default("done")` + `bundle.optional()` parse them and treat them as done (A5). No
  migration/backfill needed.
- **Frozen contract:** `packages/shared/src/bundle.ts` is untouched (R3). The C-category grep
  and `bundle.test.ts` stay green.
- **Soft-delete (R12):** terminal writes scope to `...live`; no new hard-delete path; the
  `.deleteOne/.drop` grep is unaffected.
- **Local/gate:** `WORKER_FUNCTION_NAME` empty ⇒ in-process seam ⇒ `pnpm dev` and B2 boot need
  no AWS creds (A6).
- **Residual edge:** if the worker's `failApplication` write itself fails (Mongo unreachable) the
  row could remain `pending`; AWS async retries (2×) cover transient cases. A future sweep (a
  `pending`-older-than-N-minutes → `failed` reaper) or the SQS+DLQ upgrade path closes it fully.
- **Upgrade paths (out of scope, noted):** SQS + DLQ + event-source-mapping if concurrency/
  throttling ever demands it; web/OS push (VAPID + service worker + subscription store) for
  closed-tab notification. Neither is built here.
- **SPEC bump (dev owns the edit):** v9 → v10, new §0 changelog entry; touched sections §2
  (async generation behavior), §3 (`Application` gains `status`/optional `bundle`/`error`), §5
  (`generate` returns a pending `Application`; `getApplication`/`listApplications` return rows in
  any status). §4 frozen-bundle text and R3 unchanged.

## 12. Test plan (criteria → tests)

- **T1 (A1)** `packages/server/src/generation.test.ts` — spy/muck: assert `generate`'s handler
  path calls `dispatchGeneration` and does **not** call `generateBundle` (mock both); assert the
  returned app has `status: "pending"` and no `bundle`. (vitest `vi.mock`, no Mongo — mock the
  repo.)
- **T2 (A2)** same file — assert `saveApplication` is called with `status: "pending"` **before**
  `dispatchGeneration`.
- **T3 (A3)** `generation.test.ts` — `runGenerationJob` with a mocked `generateBundle` returning
  a valid bundle calls `completeApplication(userId, appId, bundle)`; the bundle passes
  `parseBundle`.
- **T4 (A4)** `generation.test.ts` — `runGenerationJob` with `generateBundle` mocked to throw
  calls `failApplication` with a non-empty message and never `completeApplication`
  (terminal-on-throw).
- **T5 (A5)** `packages/shared/src/application.test.ts` (new) — `Application.parse` on a legacy
  row `{ id, userId, jdText, bundle, createdAt }` (no `status`) yields `status: "done"`; a
  pending row `{ ..., status: "pending" }` parses with `bundle` undefined; assert
  `packages/shared/src/bundle.ts` unchanged (existing `bundle.test.ts` + R3 grep).
- **T6 (A6)** `generation.test.ts` — with `WORKER_FUNCTION_NAME` unset, `dispatchGeneration`
  invokes `runGenerationJob` in-process and never imports `@aws-sdk/client-lambda` / constructs a
  client (assert via a mock that the AWS import is not reached; and that no throw occurs without
  AWS creds).
- **A7** — manual/UX (fire, reload mid-flight → reconnect shows running then done; force a
  failure → toast + retry). Not gate-blocking beyond typecheck/lint.
- **A8** — `bash harness/validate.sh` full gate exits 0 (R1); includes B2 boot on the in-process
  path.

## 13. Readiness checklist (self-applied)

- **Requirements clear and testable?** **Yes.** Every acceptance criterion A1–A8 is binary and
  mapped to a test or the gate (§12). PM product forks (worker Lambda, poll+toast) are settled
  and honored.
- **Design free of gaps / unrealistic assumptions?** **Yes**, with one documented residual: a
  Mongo-unreachable `failApplication` could leave a row `pending` — bounded by AWS async retries
  and flagged as an upgrade-path/reaper item (§11), not a blocker for this scope.
- **Lands in the current architecture without breaking contracts?** **Yes.** Frozen
  `GenerationBundle` untouched (R3); single schema home preserved; soft-delete/R12 grep
  unaffected; config via `env.ts` (R7); pino logging (R8); Anthropic server-only (R5); tRPC
  return type of `generate` stays `Application`; local/gate run with no AWS.
- **New dependency?** One dev-only: `@aws-sdk/client-lambda` (types + local resolution;
  externalized, zero runtime bytes, runtime-provided). Called out in §8.

**Verdict: all green — ready for dev.**
