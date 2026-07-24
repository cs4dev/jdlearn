# SPEC — jdlearn (v7, FROZEN 2026-07-06)

> The only source of truth for scope + behavior. Changes require a version bump
> (v1 → v2 …) with the changed sections listed — never an edit-in-place during
> implementation (RULES R2).

## §0 v7 changelog — Google sign-in
Adds **Google** as a sign-in option alongside email+password (Better Auth social provider).
Enabled only when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are both set (server env);
the auth card shows a "Continue with Google" button that runs the OAuth redirect flow.
Changed sections: §2, §5, §6, §7.

## §0 v6 changelog — edit the generated cover letter
The cover letter can be **edited in place** by the user in the bundle view and saved. New
`updateCoverLetter` tRPC mutation (owner-scoped, live rows only) overwrites just the
`bundle.coverLetter` string of a stored application — the rest of the frozen bundle
(fit map, plan, roleTitle) is untouched (R3). Editing happens on a live viewed application
(the generator); the archive view stays read-only. Changed sections: §2, §5, §8.

## §0 v5 changelog — regenerate an existing application
After updating your résumé, an existing application can be **regenerated in place**: the
server re-runs generation against that application's stored `jdText` plus the caller's
current résumé and overwrites its `bundle` (same frozen schema, R3). No new application
row is created — the fit map, cover letter, and plan just refresh. New: `regenerateApplication`
tRPC mutation (owner-scoped, live rows only) + a "Regenerate with current résumé" action in
the bundle view. Changed sections: §2, §5, §8.

## §0 v4 changelog — JD↔résumé fit map (the core connection)
Makes the connection between the JD and the résumé an explicit, structured output — the
app's central value. The frozen `GenerationBundle` gains a required **`fitAnalysis`**:
`{ overallFit (0–100), summary, requirements[] }` where each requirement is a JD demand
tagged `match` | `partial` | `gap` with résumé `evidence` / `gapNote`. Generation now
derives the cover letter and plan FROM this map (matches lead, gaps feed the plan). The
Fit section renders first in the bundle view. This is a FROZEN-schema change (RULES R3) —
pre-v4 stored bundles lack `fitAnalysis`; the UI guards for it. Changed sections: §1, §3,
§4, §8.

## §0 v3.5 changelog — résumé import: Markdown + drag-and-drop
Résumé import now also accepts **Markdown/plain-text** (`.md`/`.markdown`/`.txt`, read as
UTF-8 — no extraction lib, still Claude-structured) alongside PDF/DOCX, and the import
control is a **drag-and-drop drop zone** (drag a file or click to browse). Rate limit +
cheap extraction model (v3.3) unchanged. Changed sections: §2, §8.

## §0 v3.4 changelog — permanent delete on archived applications
Adds "Delete forever" on the archive page: a SPEC-sanctioned **hard delete** (RULES R12
escape hatch) that permanently removes an application. `purgeApplication` deletes only
rows that are ALREADY archived (`deletedAt` set) and owner-scoped — a live application can
never be hard-deleted, only soft-deleted first — behind a double-confirm modal. This is
the one place R12's `// hard-delete: SPEC §5` marker is used. Changed sections: §2, §5, §8.

## §0 v3.3 changelog — résumé-import rate limit + cheaper extraction model
Cost controls on résumé import (each import calls Claude): (1) **one import per user per
rolling 30-day window** — a frozen pure policy `canImportResume` (shared, tested),
persisted per-user (`resume_imports`), enforced in `importResume` BEFORE the Claude call;
recorded only on success. (2) Extraction now uses a **cheaper model** — new env
`ANTHROPIC_EXTRACT_MODEL` (default `claude-haiku-4-5`); generation keeps `ANTHROPIC_MODEL`
(Opus). Changed sections: §4, §5, §6, §7, §8.

## §0 v3.2 changelog — résumé export is PDF (was markdown)
Markdown export replaced with **Download PDF** via the browser's native print dialog (a
print-optimized HTML document; no PDF library). Markdown export was deemed not useful.
Changed sections: §2, §8. (`resumeToMarkdown` stays — still used for the generation prompt.)

## §0 v3.1 changelog — résumé import (PDF / DOCX)
Adds importing an existing résumé: upload a PDF or `.docx`, the server extracts its text
(`unpdf` / `mammoth`) and Claude structures it into the `Resume` shape, which **prefills
the builder for review** (not auto-saved — the user edits, then Saves). New: `importResume`
tRPC mutation + `packages/server/src/resume-parse.ts`; import button in the builder. The
`Resume` schema is unchanged (reused as the extraction target). Changed sections: §2, §5,
§7, §8. (v3 changelog below retained.)

## §0 v3 changelog — candidate résumé (personalized generation)
Adds a per-user **résumé** so generation is written from the candidate's real history
instead of generic claims (fixes "the cover letter is too generic"). New: `Resume`
schema + `resumeToMarkdown` (`packages/shared/src/resume.ts`), per-user résumé persistence
(one doc, upsert), `getResume`/`saveResume` tRPC procedures, a structured **résumé builder**
page (`/resume`) with markdown export, and `generate` now loads the caller's résumé and
feeds it to the prompt. The frozen `GenerationBundle` shape is UNCHANGED (résumé informs
the prompt, not the output). Changed sections: §1, §2, §3, §4, §5, §6, §8. (v2 changelog
below retained for history.)

## §0 v2 changelog — runnable-demo feature removed
The generated **runnable demo project** is dropped (deemed out of scope). A bundle is
now just a cover letter + learning plan. Removed: `Demo`/`DemoFile` schema, the demo
sandbox write guard (`safeDemoPath`/`materializeDemo`), demo materialization in
`generate`, the `downloadDemo` zip endpoint, and all demo acceptance criteria. RULES R4
(sandbox guard) is retired. Changed sections: §1, §2, §3, §4, §5, §6, §8, §9.

## §1 Purpose
jdlearn helps a job seeker see, and act on, the **connection between their résumé and a
job description**: an explicit **fit map** (each JD requirement matched to their real
evidence, or flagged as a gap), from which it derives a tailored **cover letter** and an
ordered **learning plan** to close the gaps. The candidate maintains a **résumé** so all
of it is grounded in their real history, not generic claims. Single-user tool.

## §2 Scope (v3)
**In:**
1. Paste JD text; server sends it (plus the caller's résumé, if any) to Claude and returns
   one structured `GenerationBundle` (cover letter, ≥3 learning steps).
2. Persist applications; list and reopen past bundles; soft-delete + restore (archive);
   permanently delete an archived application ("Permanently delete", irreversible).
   Regenerate an existing application in place (re-run against its stored JD + the current
   résumé, overwriting its bundle — no new row).
3. Copy the cover letter to the clipboard; edit it in place and save (live applications).
4. Maintain a per-user **résumé** via a structured builder (contact, summary, experience,
   education, skills); persisted (one per user); downloadable as PDF (browser print).
5. **Import a résumé** by uploading a PDF, Word (`.docx`), or Markdown/text
   (`.md`/`.markdown`/`.txt`) file — drag-and-drop or click-to-browse. Server extracts text
   + Claude structures it into the `Resume` shape, which prefills the builder for review
   (not auto-saved).
6. Single user, email+password auth (Better Auth); optionally **sign in with Google**
   (OAuth) when Google credentials are configured on the server.

**Out (v3.2):** generating/running a demo project (dropped v2); scraping a JD/résumé from a
URL (upload a file or type it); résumé *import* formats other than PDF/`.docx`; server-side
PDF rendering (export is the browser's own print-to-PDF); multiple résumé versions per user;
multi-user / sharing; payments.

## §3 Domain model
- **Application** — `{ id, userId, jdText, bundle, createdAt, deletedAt? }`.
- **GenerationBundle** (FROZEN, see §4) — `{ roleTitle, fitAnalysis, coverLetter,
  learningPlan[] }`.
- **FitAnalysis** — `{ overallFit (0–100), summary, requirements[] }`.
- **FitRequirement** — `{ text, status: match|partial|gap, evidence, gapNote }`.
- **LearningStep** — `{ title, detail, resources[], estimateHours? }`.
- **Resume** — `{ fullName, email, phone, location, links[], summary, experience[],
  education[], skills[], updatedAt }`; one per user. `resumeToMarkdown` renders it for the
  prompt and for export.

## §4 Core behavior / algorithms
- **FROZEN — `GenerationBundle` schema** owns the contract between Claude's output,
  persistence, and the UI. Implemented exactly once in `packages/shared/src/bundle.ts`
  (Zod). Model output that does not parse is rejected and never persisted (RULES R3).
- **Fit-first generation** — `generate` loads the caller's résumé (if present), includes
  it (as markdown) in the prompt, and the model builds the bundle FIT-FIRST: it extracts
  the JD's requirements and maps each to the résumé as `match`/`partial`/`gap` with
  evidence (`fitAnalysis`), then derives the cover letter (matches lead, no gap claimed as
  strength) and the plan (closes gaps/partials) FROM that map. Status is grounded only in
  résumé evidence, never invented. Without a résumé, requirements are gaps and the summary
  says to add one. `overallFit` is 0–100.
- **Résumé import** — text extraction (unpdf/mammoth) then a cheap-model Claude call
  structures it into `Resume`. Gated by **FROZEN — `canImportResume`** (`packages/shared/
  src/rate-limit.ts`): one import per user per rolling 30-day window, single pure policy,
  checked before the Claude call. The window is rolling (last + 30 days), not calendar.

## §5 API surface (tRPC)
- `health` — public query → `{ ok: true }`. Liveness.
- `generate` — protected mutation, input `{ jdText: string }` → `Application`.
  Server loads the caller's résumé, calls Claude, parses with the frozen schema, persists.
  Server is the authority: the client never sends the bundle, only JD text.
- `updateCoverLetter` — protected mutation, input `{ id, coverLetter }` → `{ ok: true }`.
  Owner-scoped, live rows only; overwrites `bundle.coverLetter` in place (rest of the frozen
  bundle untouched). 404 if no live application matches.
- `listApplications` / `getApplication` / `listArchived` — protected, scoped to `userId`.
- `deleteApplication` / `restoreApplication` — protected soft-delete/restore (RULES R12).
- `regenerateApplication` — protected mutation, input `{ id }` → `Application`. Owner-scoped,
  live rows only; re-runs `generate` against the stored `jdText` + current résumé and
  overwrites the row's `bundle` (frozen schema). 404 if no live application matches.
- `purgeApplication` — protected HARD delete (RULES R12 escape hatch). Owner-scoped and
  restricted to already-archived rows (`deletedAt` set); a live application cannot be
  purged. Irreversible.
- `getResume` → `Resume | null`; `saveResume` (input `Resume`) upserts, stamps `updatedAt`
  — both protected, scoped to `userId`.
- `importResume` — protected mutation, input `{ filename, dataBase64 }` → `Resume`. Server
  extracts text (PDF/DOCX, ≤5MB) and Claude (cheap model) structures it; the result is
  returned, NOT persisted (caller reviews then calls `saveResume`). Rate-limited: one
  import per user per 30-day window (`canImportResume`), checked before the Claude call;
  over-limit → `TOO_MANY_REQUESTS` with the next-allowed date.
- Auth: Better Auth at `/api/auth/*` — email+password, plus Google OAuth when
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set (redirect flow via
  `/api/auth/callback/google`). ANTHROPIC_API_KEY and the Google secret are server-only and
  never returned in any response (RULES R5).

## §6 Constraints
- Learning plan ≥ 3 steps (enforced by the schema). Résumé requires a non-empty `fullName`.
- One résumé per user (upsert, never duplicated).
- Google sign-in is enabled only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  are set; the OAuth client secret is server-only (RULES R5).
- Résumé import: one per user per rolling 30-day window (`RESUME_IMPORT_WINDOW_DAYS`).
- Generation model from `ANTHROPIC_MODEL` (default `claude-opus-4-8`); résumé extraction
  from `ANTHROPIC_EXTRACT_MODEL` (default `claude-haiku-4-5`, cheaper).

## §7 Stack
- Monorepo: pnpm workspaces. TypeScript throughout, extensionless imports.
- **shared** — Zod schema (the frozen core).
- **server** — Fastify 5 + tRPC 11 + MongoDB + Better Auth + `@anthropic-ai/sdk`,
  run via `tsx`. Structured logging with pino. Résumé text extraction: `unpdf` (PDF),
  `mammoth` (DOCX).
- **client** — React 19 + TanStack Router (code-based) + TanStack Query + Tailwind 4 +
  Vite, same-origin `/trpc` + `/api` proxy.

## §8 Acceptance criteria
1. `generate` with JD text returns a bundle that parses against the frozen schema.
2. The bundle has a non-empty cover letter, ≥3 learning steps, and a `fitAnalysis` with
   `overallFit` 0–100 and ≥1 requirement (each tagged match/partial/gap); a bundle missing
   `fitAnalysis` is rejected.
3. With `ANTHROPIC_API_KEY` unset, `generate` returns a clear error, no crash.
4. The Anthropic key never appears in any client payload, bundle, or built client bundle.
5. `generate` / list / get require an authenticated session.
6. Past applications are listed and can be reopened (scoped to the user).
7. The cover letter can be copied to the clipboard from the bundle view, and edited in
   place and saved on a live application (`updateCoverLetter`, owner-scoped; the persisted
   `bundle.coverLetter` changes, the rest of the bundle does not); the archive view is
   read-only.
8. A résumé with a non-empty `fullName` saves and reloads (one per user, upsert); an empty
   `fullName` is rejected.
9. When a résumé exists, `generate` includes it in the prompt (the cover letter draws on
   the candidate's real history); when absent, generation still succeeds generically.
10. The résumé downloads as a PDF from the builder (native browser print of a formatted
    résumé document).
11. Importing a PDF/DOCX/Markdown file (via drag-and-drop or browse) returns a structured
    `Resume` that prefills the builder without persisting; an unsupported file type or
    missing key returns a clear error, no crash.
12. A second résumé import within the 30-day window is rejected with a clear
    next-allowed date (`canImportResume`), before any Claude call; the window resets after
    it passes.
13. "Permanently delete" on an archived application hard-deletes it (owner-scoped,
    archived-only, behind a confirm modal); it no longer appears in the archive and is not
    restorable. A non-archived (live) application cannot be purged via this path.
14. The bundle view shows the fit map (score + per-requirement match/partial/gap) for
    v4+ bundles; pre-v4 bundles without `fitAnalysis` still render (no crash).
15. Regenerating an existing application re-runs generation against its stored JD + the
    current résumé and overwrites its bundle in place (no new application row; owner-scoped);
    a missing/archived id returns a clear error, no crash.
16. `harness/validate.sh` exits 0.

## §9 Glossary
- **JD** — job description text pasted by the user.
- **Bundle** — the `GenerationBundle`: one generation's full output.
- **Fit map** — the `fitAnalysis`: JD requirements mapped to résumé evidence
  (match/partial/gap) + a 0–100 score; the connection the rest of the bundle builds on.
- **Résumé** — the candidate's persisted background (one per user); feeds the generation
  prompt so output is personalized, and is exportable.
