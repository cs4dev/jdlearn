# Task Board — jdlearn

> Requirement-side registry. Active tasks, current stage, linked docs, delivery conclusions.
> Maintained by the PM. **Append-only**: never remove or reorder entries — only update
> stage/status. ONE task active at a time.

## Tracks
`solo: dev(gate) → done` · `fast: spec → dev → review∥qa → done` · `full: design → dev → review∥qa → done`

## Active
_None._

## Planned (next)
_None._

## Bugs spotted (not yet tasks)
_None._

## Done
- **T-021 — async generation (durable job, non-blocking UI)** (2026-08-14, full track, SPEC
  v10). Generation moved OFF the tRPC request path so a mid-flight refresh/close no longer loses
  work or double-spends Anthropic. `Application` gains a `status` (`pending|done|failed`,
  `.default("done")` for pre-T-021 rows), optional-until-done `bundle`, `error`, `updatedAt` —
  single schema home, frozen `GenerationBundle` untouched (R3). `generate` now persists a
  `pending` row BEFORE Claude, then `dispatchGeneration` and returns immediately; polling reuses
  `getApplication`, `listApplications` surfaces pending/failed for reload-reconnect. New
  `generation.ts` seam (`runGenerationJob` = try→`completeApplication`/catch→`failApplication`,
  terminal-on-throw; `dispatchGeneration` switches on `WORKER_FUNCTION_NAME`: set → async
  `Event` invoke of a 2nd worker Lambda / unset → in-process fire-and-forget so local+gate need
  no AWS). New `lambda/worker.ts` handler (Zod-validated Event payload). Infra: `aws_lambda_function.worker`
  (shared zip, `worker.handler`, timeout 120, no Function URL) + IAM `lambda:InvokeFunction` +
  `WORKER_FUNCTION_NAME` in `lambda_env` (fixed-name, acyclic). Client: fire→poll(2s)→toast→render,
  reconnect from a `pending` row on reload, failed→banner+Retry (HeroUI `addToast`/`ToastProvider`,
  no new client dep). One dev-only dep `@aws-sdk/client-lambda` (externalized, zero runtime bytes).
  PM forks: async worker Lambda (not SQS) + in-app poll/toast (not web push) — both settled by
  the user upfront. Reviewer **APPROVE** (0 blocking, 3 nits), QA **PASS**, full gate
  `VALIDATION: PASS`. Deploy-time/manual-verify: `terraform validate`+apply (local TF 1.8.4 <
  required 1.10.0), the real AWS async-invoke + IAM path, and browser fire→reload-reconnect→toast/
  retry UX (A7). Residual (design §11): a Mongo-unreachable `failApplication` could leave a row
  `pending` — bounded by AWS 2× async retry; `pending`-reaper or SQS+DLQ is the upgrade path.
  Out of scope (deferred): SQS/DLQ, web push, async for `regenerateApplication`/`importResume` (⇒ T-022).
- **T-020 — capstone project in the learning plan** (2026-08-12, full track, SPEC v9).
  `GenerationBundle` gains an optional **`project`** (`LearningProject`: `title`, `summary`,
  `techStack[]`, `milestones[]`) — the capstone the learning plan builds toward, tech drawn
  from the JD. Optional in Zod so pre-v9 stored bundles still `parseBundle` on read (R3);
  **required** in the `emit_bundle` tool so new generations always emit one. `anthropic.ts`
  SYSTEM prompt + tool schema updated; `BundleView` renders a capstone card (tech-stack chips
  + numbered milestones) inside the Learning plan section. Tests: project accepted, back-compat
  (missing `project` parses), <2 milestones rejected. SPEC §0/§2/§3/§4 bumped v8→v9. Full gate
  `VALIDATION: PASS`. Live Claude emission of a `project` not gate-verified (no API key).
- **T-019 — résumé projects (extract + edit + render)** (2026-07-26, fast track, SPEC v8).
  `Resume` gains a **`projects`** array (`ResumeProject`: `name`, `link`, `bullets`) between
  experience and education (`shared/src/resume.ts`), rendered by `resumeToMarkdown` (Projects
  section) so it reaches the generation prompt + fit map. Extraction (`resume-parse.ts`)
  emits projects distinctly from employment (tool schema + system-prompt guidance). Builder
  (`ResumeBuilder.tsx`) gets a Projects card (add/edit/remove, name+link+bullets), PDF export
  section, and blank-bullet cleaning; `updateAt`/`removeAt` unions widened. Additive/backward-
  compatible (missing `projects` → `[]`). Tests extended (schema default + markdown render).
  Full gate `VALIDATION: PASS`. Live Claude extraction of projects not gate-verified (no key).
- **T-018 — kill the pointless first-load skeleton** (2026-07-26, solo track, no SPEC
  change). The whole landing (hero, sample fit map, auth form) is static and needs no
  session, yet `Home.tsx` gated it behind `<PageSkeleton/>` until `authClient.useSession()`
  resolved — a fresh visitor waited on a session round-trip (worst against a cold Lambda)
  for content that needs no auth, then the page popped in. Now the skeleton shows only when
  a session is plausible: a `jdlearn.hasSession` localStorage flag (set when a session
  resolves, cleared when it resolves to none — covers sign-out). Fresh visitors render the
  landing immediately; returning users still skeleton-then-app with no logged-out flash.
  httpOnly session cookie can't be read from JS, hence the flag. Full gate `VALIDATION: PASS`.
- **T-017 — gate JD input on having a résumé** (2026-07-24, solo track, no SPEC change).
  Signed-in users with no résumé could paste a JD and get a generic (non-personalized)
  letter. `Generator.tsx` now queries `getResume`: `null` → the JD textarea card is
  replaced with an "Add your résumé first" CTA card linking to `/resume` (skeleton while
  pending); once a résumé exists the JD input renders as before. Client-only, no server/
  SPEC change (`getResume` already existed). Gate PASS (--no-boot). Live no-résumé flow +
  browser render are manual-verify.
- **T-016 — Google sign-in** (2026-07-06, solo track, SPEC v7). Better Auth social provider:
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env (server-only, R5); `auth.ts` adds
  `socialProviders.google` only when both are set. `AuthForm` gets an "or" divider +
  "Continue with Google" button (`authClient.signIn.social({ provider: "google",
  callbackURL: window.location.origin })`, graceful error). `.env.example` documents the
  vars + the `/api/auth/callback/google` redirect URI. SPEC §2/§5/§6/§7 bumped v6→v7.
  Live OAuth debugged against the working heymax reference — three fixes: (1) **account
  linking** — `account.accountLinking.requireLocalEmailVerified: false` (+ `enabled`,
  `trustedProviders:["google"]`); the real "account not linked" cause was Better Auth
  refusing to link Google onto a password account whose email isn't verified, and jdlearn
  has no verification flow (every password user is `emailVerified:false`). (2) **callback
  redirect** — replaced the hand-rolled fetch bridge in `index.ts` with `toNodeHandler`
  (raw Node req/res in an encapsulated plugin + null JSON parser); the old bridge dropped
  the OAuth 302's `location` header, so the callback rendered as a blank `null` page.
  (3) **dev origin** — `TRUSTED_ORIGINS` default widened to `:5173,:5174` (Vite falls back
  to 5174 when 5173 is taken). Google console redirect URI stays server-origin
  (`localhost:3000/api/auth/callback/google`), unaffected by the client port.
- **T-015 — editable cover letter + landing copy for résumé upload** (2026-07-06, solo
  track, SPEC v6). Cover letter is now editable in place in the bundle view (live apps):
  Edit → Markdown Textarea → Save via new `updateCoverLetter` tRPC mutation
  (`updateApplicationCoverLetter` repo, owner-scoped + live-only `$set bundle.coverLetter`;
  404 on miss; frozen bundle otherwise untouched, R3 intact). `BundleView` gains
  `editable`/`onSaved`; Generator passes both and syncs `viewing`; Archived stays read-only.
  Landing page (`Home.tsx`) copy updated to mention résumé upload (PDF/Word/Markdown) and
  that the cover letter is editable. SPEC §2/§5/§8 bumped v5→v6. Live edit round-trip
  (real DB) is manual-verify.
- **T-014 — regenerate an existing application with the updated résumé** (2026-07-02, SPEC
  v5). After updating your résumé, an existing app can be refreshed in place instead of
  generating a duplicate: new `regenerateApplication` tRPC mutation (owner-scoped, live rows
  only, 404 on miss) re-runs `generateBundle(storedJdText, currentResume)` and overwrites the
  row's `bundle` via `updateApplicationBundle` (frozen schema, R3 intact — no new row).
  Bundle view gains a "Regenerate with current résumé" button. SPEC §2/§5/§8 bumped v4→v5.
  Live regen (real key/DB) is manual-verify.
- **T-013 — JD↔résumé fit map (the core connection)** (2026-07-02, full track, SPEC v4).
  Frozen `GenerationBundle` gains required `fitAnalysis` = `{ overallFit 0–100, summary,
  requirements[] }` (each match|partial|gap w/ evidence/gapNote); single schema (R3), +2
  tests (15 total). Fit-first generation: prompt/tool extract JD requirements → map to
  résumé → derive cover letter (matches lead) + plan (closes gaps) from it. BundleView
  "Fit for this role" section first (score + status chips), guarded so pre-v4 stored
  bundles still render. Reviewer APPROVE + QA PASS, gate PASS. Nit fixed (tool description
  now names the fit map). Live map quality/no-résumé path/browser render are manual-verify.
- **T-012 — résumé import: Markdown + drag-and-drop** (2026-07-01, fast track, SPEC v3.5).
  Server accepts `.md`/`.markdown`/`.txt` (UTF-8 read, no lib) → same Claude structuring +
  5MB cap + rate limit. Client import control is a dashed drag-and-drop drop zone with
  click-to-browse + drag-over highlight; shared `handleFile` for input-change and drop.
  Reviewer APPROVE + QA PASS, gate PASS. Nit (a .txt beginning with `%PDF-` bytes routes to
  the PDF parser) left as-is — pre-existing extension/sniff behavior, out of scope. Live
  extraction + drag gesture are manual-verify.
- **T-011 — permanent delete on archived applications** (2026-07-01, full track, SPEC
  v3.4). "Permanently delete" on `/archived` → HARD delete (`purgeApplication`, R12 escape
  hatch): `deleteOne({ userId, id, deletedAt: { $ne: null } })` — owner-scoped + archived-
  only (a live app can never be purged) with `// hard-delete: SPEC §5` marker keeping the
  R12 grep green (exactly one marked hard-delete in server src). tRPC protected mutation;
  double-confirm modal; empty-redirect guard accounts for in-flight purge. Reviewer
  APPROVE + QA PASS, full gate PASS. Nits (no onError, ignored return) left as-is (match
  existing restore pattern; benign). Live purge round-trip is manual-verify.
- **T-010 — résumé-import rate limit + cheaper extraction model** (2026-07-01, full track,
  SPEC v3.3). Frozen `canImportResume` (shared, 4 tests: first/within/boundary/after) — one
  import per user per rolling 30-day window; `resume_imports` per-user upsert; `importResume`
  checks the gate BEFORE the Claude call (`TOO_MANY_REQUESTS` + next-allowed date), records
  timestamp only on success. Extraction moved to `ANTHROPIC_EXTRACT_MODEL` (default Haiku
  4.5); generation keeps Opus. Reviewer APPROVE + QA PASS, full gate `VALIDATION: PASS`.
  Applied 2 nits (locale-independent YYYY-MM-DD date, dropped non-null assertion). TOCTOU
  (concurrent double-import) reviewer-judged out-of-scope for a per-user cost cap — atomic
  conditional-update is the upgrade path if ever needed. Live per-user Mongo enforcement +
  Haiku actually invoked are manual-verify (need key/DB).
- **T-009 — résumé export: PDF, not markdown** (2026-07-01, solo track, SPEC v3.2).
  Replaced the `.md` download with **Download PDF** via the browser's native print dialog
  (`resumeHtml()` builds a print-optimized, HTML-escaped résumé doc; `window.print()`).
  No PDF dependency. `resumeToMarkdown` retained (still feeds the generation prompt).
  Markdown export judged useless. Gate PASS.
- **T-008 — résumé import (PDF/DOCX)** (2026-07-01, full track, SPEC v3.1). Server
  `resume-parse.ts`: `unpdf`/`mammoth` text extraction (≤5MB) → Claude structured
  extraction (told to use only text present) → validated `Resume`; `importResume` tRPC
  mutation returns it UNSAVED; builder "Import PDF/Word" button prefills the form for
  review (never auto-overwrites). QA PASS; reviewer BLOCK → caught Fastify default 1MiB
  bodyLimit would 413 base64 uploads >~750KB before the 5MB check → fixed
  (`bodyLimit: 10MiB` + tRPC `dataBase64` bound) → re-review APPROVE. Gate PASS. Live
  extract+parse (real key + sample PDF/.docx) is manual-verify. `Resume` schema unchanged.
- **T-007 — candidate résumé (personalized generation)** (2026-07-01, full track,
  SPEC v3). Per-user `Resume` (shared schema + `resumeToMarkdown`, 5 tests), upsert repo
  (`getResume`/`saveResume`, userId-scoped, `_id`+`userId` projected out), `generate`
  loads the caller's résumé into the prompt (cover letter from real history; generic when
  absent; frozen `GenerationBundle` unchanged, R3 intact), `/resume` structured builder
  + markdown export + nav link. Reviewer APPROVE, QA PASS, full gate `VALIDATION: PASS`.
  Applied 2 reviewer nits (server trims whitespace-only `fullName`; blank bullets dropped
  before persist). Live follow-up (not gate-coverable): real generate-with-résumé, Mongo
  upsert round-trip, browser .md download — need key/DB/browser.
- **T-006 — harness: repeatable rules R12 (soft-delete default) + R13 (landing/404)**
  (2026-06-30, solo track). RULES.md +R12 (deletion soft by default: `deletedAt`, reads
  exclude, restore path; hard delete only with `// hard-delete: SPEC §X`) +R13 (client
  always has `/` landing + `defaultNotFoundComponent`). validate.sh Category C: two new
  greps (R12 flags unmarked `deleteOne/deleteMany/findOneAndDelete/drop` in server src;
  R13 asserts not-found component + `/` route in client src). context.md refreshed
  (dropped stale R4/demo, added R12/R13 + current file map). Gate PASS; greps
  negative-tested (fire on violation, honor the hard-delete marker).
- **T-003 — past applications list/reopen, soft delete, archive page** (2026-06-30, fast
  track). Plain-row list with reopen + active highlight. Owner-scoped **soft delete**
  (`Application.deletedAt` nullish; `updateOne $set deletedAt`; `list`/`get` filter
  `deletedAt: null`) behind a double-confirm modal. New **`/archived` page** (TanStack
  code-based route, shared `Header`) lists soft-deleted apps via `listArchived`
  (`deletedAt: $ne null`) with **Restore** (`restoreApplication` → `$set deletedAt:null`).
  All load states use HeroUI **Skeleton** (`Skeletons.tsx`: `RowsSkeleton`/`PageSkeleton`).
  Doc `docs/tasks/T-003/task.md`. Gate PASS. Live-verified full round-trip: delete →
  appears in /archived → restore → back in main list (Mongo confirms `deletedAt` toggles,
  doc always retained). Note: dev server hits host :27017 = `heymax-mongo-1` (jdlearn-mongo
  container isn't port-mapped) — pre-existing, unrelated.
- **T-005 — drop runnable-demo feature, polish bundle UI** (2026-06-30, solo track).
  SPEC v2 bump: removed `Demo`/`DemoFile` schema + sandbox guard from frozen core
  (`bundle.ts`), demo materialization in `generate`, `/api/apps/:id/demo.zip` route
  (jszip dep removed), demo section in BundleView. Anthropic prompt/tool now emit only
  cover letter + learning plan. RULES R4 retired. UI: BundleView gains a Copy button for
  the cover letter; Home/AuthForm copy de-demo'd. Gate PASS (--no-boot). Supersedes the
  T-002 demo work.
- **T-002 — demo zip download** (2026-06-30, fast track). `GET /api/apps/:id/demo.zip`
  (jszip, in-memory from bundle files, auth-scoped, 401/404). Shared `session.ts` helper
  (tRPC + route). Download button in BundleView; Generator tracks the Application. Browse
  was already covered by the file Accordion. Gate PASS; route verified 401 unauth.
- **T-004 — design pass: HeroUI clean-light** (2026-06-30, solo track). Adopted HeroUI
  (+ framer-motion) wired for Tailwind 4 (`@plugin hero.ts` + `@source` theme glob, pnpm
  `public-hoist-pattern` for `@heroui/*`), indigo primary. Restyled Home/AuthForm/
  Generator/BundleView (Card/Input/Textarea/Button/Listbox/Accordion/Snippet/Chip).
  Fixed lint+vitest to exclude runtime-generated `data/**` demos. Gate PASS.
  Note: client JS bundle ~871kB (245kB gz) from HeroUI+framer-motion — code-split later if it matters.
- **T-001 — JD → bundle generation pipeline** (2026-06-30, full track). Server:
  `anthropic.ts` (forced tool-use → `parseBundle`, missing-key error), `repository.ts`
  (user-scoped Applications), `trpc.ts` (session context + `protectedProcedure` +
  generate/list/get), `/api/auth/*` mount. Shared `Application`. Client: auth gate +
  generator + bundle view. Reviewer caught missing `trustedOrigins` (split-port 403),
  fixed via env. Gate PASS. Live Claude + sign-in not gate-verified (no key/DB/browser).
- **T-000 — harness + walking skeleton** (2026-06-30). Frozen `GenerationBundle` schema +
  sandbox guard with tests; Fastify boot + `/api/health`; tRPC `health`; React shell;
  gate green. Skeleton only — features are T-001+.
