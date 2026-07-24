# test

- `pnpm test` — Vitest, all `packages/**/*.test.ts`.
- The frozen core (`packages/shared/src/bundle.test.ts`) covers the schema and the
  sandbox path guard — keep these green; they are the security/contract boundary.
- Iterate on one file with `pnpm vitest run packages/shared/src/bundle.test.ts`.
