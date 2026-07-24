# run — start the whole app

1. `bash scripts/init.sh` once (Mongo + `.env`).
2. `pnpm dev` — server on http://localhost:3000, client on http://localhost:5173
   (client proxies `/trpc` + `/api` to the server).
3. For real generation set `ANTHROPIC_API_KEY` in `.env` (RULES R5; server-only).
Liveness: `curl http://localhost:3000/api/health` → `{"ok":true}`.
