# validate — the master gate

`bash harness/validate.sh` is the objective judge of done (RULES R1). Modes:
- (no args) — full: A build/static + B tests + B2 boot probe + C rule greps + D workflow.
  Run by QA, and by the dev on a solo task. The ONE boot per task.
- `--no-boot` — A + B + C + D. The developer's loop.
- `--static` — A + C + D. The code reviewer.

A failure in A skips B/B2 (noise on a broken build) but still runs C/D. The gate FAILS
(never skips) when a prerequisite is missing. Fix the work, not the gate.
