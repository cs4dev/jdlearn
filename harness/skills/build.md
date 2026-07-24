# build

- `pnpm -r typecheck` — type-check every package.
- `pnpm build` — build the client bundle (Vite). The server runs from TS via `tsx`,
  so it has no separate build step; typecheck is its build gate.
