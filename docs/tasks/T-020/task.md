# T-020 — capstone project in the learning plan

**Track:** full (frozen `GenerationBundle` contract change → SPEC bump, R3). Executed by the
main session as PM+dev; the full gate is the verdict.

## Goal
Expand the learning plan with **one capstone project** the plan builds toward, built with
the **JD's own tech stack**. A concrete thing to build so the candidate ends with something
real in the role's stack.

## Design (locked with the user)
- **Shape:** a single `project` on the bundle — `{ title, summary, techStack[], milestones[] }`
  (not per-step; not free-text appended to `learningPlan`).
- **Tech stack source:** derived from the JD's stated technologies.
- **Framing:** the project is the capstone of the learning plan (rendered inside the Learning
  plan section), not a disconnected block.

## Correctness constraint (R3)
Stored bundles predate v9 and have no `project`. Reads go through `parseBundle`, so `project`
is **optional in Zod** (old bundles parse) but **required in the `emit_bundle` tool schema**
(new generations always include it).

## Changes
- `packages/shared/src/bundle.ts` — `ProjectMilestone`, `LearningProject`, `project?` on bundle.
- `packages/server/src/anthropic.ts` — SYSTEM bullet + tool `project` (required) with milestones.
- `packages/client/src/BundleView.tsx` — capstone card inside the Learning plan section.
- `packages/shared/src/bundle.test.ts` — project accepted, back-compat (missing ok), <2 milestones rejected.
- `SPEC.md` — v8→v9 changelog + §2/§3/§4.

## Verification
- Full gate PASS. Live Claude emission of a `project` not gate-verified (no API key in gate) —
  covered by the tool `required` + schema tests.
