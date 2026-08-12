# dev-map — jdlearn

> Navigation chart. **Read before writing code.** Maintained by whoever changes the code.

## Top-level layout
```
SPEC.md RULES.md CLAUDE.md      # frozen scope / red lines / index
harness/                        # validate.sh, context.md, skills/, workflow/
docs/                           # dev-map, task-board, tasks/<id>/
scripts/init.sh                 # Mongo + .env + deps
packages/
  shared/src/bundle.ts          # FROZEN GenerationBundle schema (+ test)
  server/src/                    # Fastify + tRPC + Mongo + Better Auth + Anthropic
  client/src/                    # React 19 + TanStack Router + Tailwind 4
```

## Where things live
- **shared/src/bundle.ts** — the ONLY place the `GenerationBundle` shape exists (incl.
  `FitAnalysis`/`FitRequirement`, SPEC v4; optional `LearningProject` capstone, SPEC v9).
  Do not duplicate it (RULES R3). Pure + tested.
  (Demo schema + sandbox guard removed in SPEC v2.)
- **shared/src/resume.ts** — `Resume` schema + `resumeToMarkdown` (SPEC v3). Tested. NOT
  the frozen bundle; it feeds the prompt, not the output.
- **shared/src/rate-limit.ts** — FROZEN `canImportResume` policy (one import / 30-day
  rolling window). Pure + tested. Single home for the rate-limit rule (SPEC v3.3).
- **server/src** — `env.ts` (Zod env), `logger.ts` (pino), `db.ts` (lazy Mongo),
  `auth.ts` (lazy Better Auth; email+password + Google social provider when creds set),
  `repository.ts` (applications incl. `updateApplicationBundle`
  for in-place regen, `updateApplicationCoverLetter` for user edits + résumé upsert), `anthropic.ts`
  (prompt; takes optional résumé), `resume-parse.ts` (PDF/DOCX → text via unpdf/mammoth →
  Claude → `Resume`), `trpc.ts` (router; AppRouter type export), `index.ts`
  (Fastify boot + `/api/health`). Anthropic SDK lives only here (R5).
- **client/src** — `main.tsx` (router + tRPC + query providers), `Home.tsx` (landing:
  hero + sample fit map + auth, or the signed-in JD input), `Generator.tsx` (gates the JD
  input on `getResume` — no résumé → CTA to `/resume`; `BundleSkeleton` + staged status
  during generation), `BundleView.tsx`, `FitMap.tsx` (the shared JD↔résumé fit map —
  score + verdict rows — rendered by both `BundleView` and `Home`'s landing sample so the
  demo can't drift from the real result), `Archived.tsx`, `ResumeBuilder.tsx`
  (`/resume`), `NotFound.tsx`, `Header.tsx`, `Logo.tsx`, `Skeletons.tsx`, `trpc.ts`
  (typed client, type-only server import).

## Conventions
- Add a procedure: define it in `server/src/trpc.ts` under `appRouter`; the client picks
  up the type automatically via `@jdlearn/server/trpc`.
- New schema/types → `packages/shared`. Server config → `env.ts`, never inline.
- Extensionless imports. Run `bash harness/validate.sh` before claiming done (R1).
