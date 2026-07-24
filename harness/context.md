# context — jdlearn

> ~30-line digest every sub-agent reads FIRST instead of the full SPEC/RULES.
> Open SPEC.md / RULES.md in full only where the task touches them.

## Commands
- typecheck `pnpm -r typecheck` · lint `pnpm lint` · test `pnpm test`
- client build `pnpm build` · run all `pnpm dev` (server :3000, client :5173)
- gate `bash harness/validate.sh` (`--no-boot` dev, `--static` review, full = QA/solo)
- setup `bash scripts/init.sh` (Mongo up + `.env`)

## Frozen rules (one-liners — full text in RULES.md)
- R1 done = all four (typecheck, lint, test, gate) exit 0.
- R2 SPEC is law — nothing outside SPEC §2. R4 retired (demo feature dropped, SPEC v2).
- R3 `GenerationBundle` (shared/src/bundle.ts) is THE contract; model output must `parseBundle()` or be rejected.
- R5 Anthropic SDK + key are server-only; never in client, never in any payload.
- R7 config from `server/src/env.ts` (Zod env). R8 pino, no bare console. R9 extensionless imports.
- R12 deletion is SOFT by default (`deletedAt`, reads exclude it, restore path; no hard delete sans `// hard-delete: SPEC §X`).
- R13 client always has a `/` landing route + `defaultNotFoundComponent` (404); no orphaned pages.

## File map (top level — detail in docs/dev-map.md)
- `packages/shared/src/` — bundle.ts (FROZEN `GenerationBundle` + test), application.ts (`deletedAt`).
- `packages/server/src/` — env, logger, db (lazy Mongo), auth (lazy Better Auth), repository (soft delete/restore), trpc, index (boot + /api/health).
- `packages/client/src/` — main.tsx (router+trpc, 404), Home (landing), Archived (soft-deleted+restore), Generator, BundleView, Header, NotFound, Skeletons, trpc.ts.
- `SPEC.md` frozen scope · `RULES.md` red lines · `docs/task-board.md` task history.
