# resume — start-of-session bootstrap

Run ONCE when a session starts on this repo, before picking up any task:
0. `bash scripts/init.sh` — Mongo up + `.env` from `.env.example` if absent + deps.
1. `git status` + `git log --oneline -10` — know the state you inherited.
2. Read `docs/task-board.md` — active task + stage, or next planned task.
3. `bash harness/validate.sh --no-boot` — verify the baseline is green BEFORE new work;
   if it fails, fixing the baseline IS the first task (log it).
4. Resume from the task's routing log in `docs/tasks/<id>/task.md`.

Work ONE task per session. Never re-derive project state from chat memory — the board
and git are the truth.
