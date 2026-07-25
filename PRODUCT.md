# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Active job seekers — the full range, new grad to senior — working through
applications under time pressure and application fatigue. The user arrives with
a specific job description in hand and wants to know, fast: *do I fit this, and
what do I say?* Single-user tool (one account per deployment); each user
maintains their own résumé and their own history of applications.

## Product Purpose

jdlearn turns a job description into an explicit **fit map**: every requirement
in the JD matched to real evidence in the user's résumé, or flagged as a gap.
From that map it derives two things the user can act on immediately — a tailored
**cover letter** (grounded in their real history, matches leading, editable) and
an ordered **learning plan** that closes the gaps the role asks for. Success is
the user leaving with an application kit they can send and a clear picture of
where they stand against the role.

## Positioning

The fit map is the mechanism a generic "AI cover letter generator" cannot
truthfully copy: output is grounded **fit-first** in the user's own résumé
evidence, never invented. Each JD requirement is tagged match / partial / gap
against real evidence, and the cover letter and learning plan are *derived from*
that map — matches lead, gaps feed the plan, nothing claims a strength the résumé
doesn't support. The connection between JD and résumé is made structural and
visible, not implied.

## Operating Context

The core loop: maintain a résumé (build it in a structured builder, or import a
PDF / Word / Markdown file for review) → paste a JD → receive a bundle (fit map,
cover letter, learning plan). Applications persist: list and reopen past bundles,
edit the cover letter in place, regenerate against an updated résumé, archive
(soft-delete + restore), and permanently delete archived ones. The résumé exports
to PDF via the browser's own print dialog. A résumé should exist before a JD is
pasted — without it every requirement is a gap.

## Capabilities and Constraints

- **Fit map** — `fitAnalysis`: `overallFit` (0–100), a summary, and per-requirement
  `match | partial | gap` with résumé evidence or a gap note. Renders first in the
  bundle view. The `GenerationBundle` schema is FROZEN (`packages/shared/src/bundle.ts`).
- **Cover letter** — tailored, copy-to-clipboard, editable in place and saved on
  live applications; archive view is read-only.
- **Learning plan** — ≥3 ordered steps, each with detail and resources.
- **Résumé** — one per user (upsert); structured builder (contact, summary,
  experience, education, skills); requires a non-empty full name; exports as PDF.
- **Résumé import** — PDF / DOCX / Markdown-text, drag-and-drop or browse; Claude
  structures it and prefills the builder for review (not auto-saved). Rate-limited
  to **one import per user per rolling 30-day window**.
- **Auth** — email + password (Better Auth); optional Google sign-in when server
  Google credentials are configured.
- Server is the authority: the client sends only JD text and never the bundle;
  the Anthropic key and OAuth secret are server-only, never in any client payload.
- Pre-v4 stored bundles may lack `fitAnalysis`; the UI must render them without
  crashing.
- **Out of scope:** scraping a JD/résumé from a URL; multiple résumé versions per
  user; multi-user / sharing; payments; server-side PDF rendering.

## Brand Commitments

- **Name:** jdlearn — committed.
- Current voice is direct and outcome-first ("Turn a job post into proof.");
  the user did not make it strictly binding, so future work may evolve it, but it
  is the established starting point, not a blank slate.

## Evidence on Hand

No testimonials, customers, benchmarks, pricing, or press exist — future work
must not fabricate any. Real product surfaces exist in `packages/client/src`
(Home, Generator, BundleView, ResumeBuilder, Archived, AuthForm). The frozen
schema and its tests are the authoritative contract for output shape.

## Product Principles

1. **Fit before flattery.** Every claim traces to real résumé evidence; a gap is
   shown as a gap, never dressed up as a strength.
2. **Leave with something to send and something to do.** Each session produces an
   editable cover letter and an ordered plan — artifacts, not just a score.
3. **The résumé is the ground truth.** Personalization comes from the user's real
   history; prompt the user to supply it before generating.
4. **The server owns the truth.** Output is generated, parsed against the frozen
   schema, and persisted server-side; the client never authors the bundle.
5. **Respect the cost of generation.** Guard the paid calls (rate-limited import,
   cheaper extraction model) without degrading the core experience.

## Accessibility & Inclusion

No product-specific standard was made binding. Treat accessible defaults
(sufficient contrast, keyboard operability, honest focus states) as table stakes
for an Operate-mode application, to be set as a real bar in later design work.
