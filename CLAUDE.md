# jdlearn — Harness Index

This repo is built **harness-first**: the human builds the harness, the AI writes the
production code. Read these on entry, in order.

## Session start
Follow `harness/skills/resume.md` ONCE per session: init → git state → task-board →
baseline gate (`--no-boot`) → resume from the task's routing log. The board and git are
the truth, not chat memory.

## Read first, every task
1. **[harness/context.md](harness/context.md)** — the 30-line digest. Read THIS first.
2. **[SPEC.md](SPEC.md)** — what v1 is. FROZEN.
3. **[RULES.md](RULES.md)** — hard boundaries. R1 (Definition of Done) is non-negotiable.
4. **[docs/dev-map.md](docs/dev-map.md)** — where code lives. Read before writing code.
5. **[docs/task-board.md](docs/task-board.md)** — task history + current stage.

## Skills (SOPs)
`harness/skills/` — resume, run, build, test, validate.

## Workflow (Level 3)
- `harness/workflow/workflow.yaml` — tracks (solo / fast=default / full), stages, rollback.
- Boot budget: ONE boot per task — dev `--no-boot`, reviewer `--static`, QA full gate.
- `harness/workflow/roles/*.md` — per-agent contracts. Downstream never edits upstream.
- Per-task artifacts under `docs/tasks/<id>/`.

## The hard gate
`harness/validate.sh` is the objective judge of "done" (RULES R1) — task complete only
when it exits 0. CI (`.github/workflows/harness-gate.yml`) runs the SAME script.

## What this app does
Paste a job description → Claude returns a **fit map** (JD requirements ↔ résumé evidence,
match/partial/gap + score), and derives a cover letter and learning plan from it. The
frozen core (`packages/shared/src/bundle.ts`) is the `GenerationBundle` schema (incl.
`fitAnalysis`, SPEC v4). Candidates maintain a résumé (build or import PDF/Word/Markdown).

## Maintenance
Whoever changes code updates `dev-map`. Whoever owns the task updates `task-board`.
The harness lives in git, not chat memory.
