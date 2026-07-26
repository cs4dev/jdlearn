# jdlearn

Paste a job description → Claude returns a **fit map** (JD requirements ↔ résumé evidence,
each tagged match / partial / gap, with an overall score), then derives a tailored **cover
letter** and a focused **learning plan** from it. Candidates keep one résumé — build it in
the app or import a PDF, Word, or Markdown file.

## Stack

pnpm monorepo (Node ≥ 22) — Fastify + tRPC + Better Auth + MongoDB on the server, React 19 +
Vite + TanStack Router/Query + HeroUI on the client, Anthropic SDK for generation. Deploys to
AWS as an HTTP Lambda behind CloudFront (see `harness/skills/` and the deploy skill).

```
packages/
  shared/   frozen GenerationBundle + Resume schemas, pure policies (shared by both sides)
  server/   Fastify boot, tRPC router, Better Auth, Mongo repository, Anthropic calls
  client/   React SPA — landing, résumé builder, generator, bundle view
```

## Quick start

```bash
bash scripts/init.sh          # Mongo up + .env from .env.example
# edit .env — set ANTHROPIC_API_KEY (generation) and BETTER_AUTH_SECRET
pnpm install
pnpm dev                      # server :3000, client :5173
```

Open http://localhost:5173. Google sign-in is optional — set `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` to enable the button. All Anthropic access is server-only.

## Commands

| Command | What |
|---|---|
| `pnpm dev` | Run server + client |
| `pnpm typecheck` | Type-check every package |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm build` | Build the client bundle |
| `bash harness/validate.sh` | The gate — build, tests, boot probe, rule greps (`--no-boot` / `--static` to skip the boot) |

## How this repo is built

Harness-first: the human owns the harness, the AI writes the production code. A change is
**done only when `harness/validate.sh` exits 0** — the same script CI runs. Frozen scope and
the correctness core live in [`SPEC.md`](SPEC.md); the red lines in [`RULES.md`](RULES.md);
task history in [`docs/task-board.md`](docs/task-board.md). Start any session from
[`CLAUDE.md`](CLAUDE.md) → [`harness/context.md`](harness/context.md).
