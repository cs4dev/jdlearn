# T-002 — demo browse + zip download

**Raw request:** "start T-002" — board entry: file browser over the demo + `downloadDemo`
zip. Acceptance §8 #4–6 (#4/#5 sandbox already enforced+tested in the frozen core).

**Track:** fast — additive feature, no change to the frozen core or SPEC scope.

## Scope
- Browse: already shipped — `BundleView` lists demo files in an Accordion. No new work.
- Download: `GET /api/apps/:id/demo.zip` (Fastify route, not tRPC — binary). Auth-scoped
  via the session userId; 401 if unauthenticated, 404 if the app isn't the user's. Zips
  `app.bundle.demo.files` in memory (jszip) — same bytes as the sandbox, no fs traversal.
- Client: "Download .zip" button in `BundleView` (anchor to the route; same-origin proxy
  carries the cookie). `Generator` now tracks the whole `Application` (needs the id).

## Out
- Per-file raw download, run-in-browser, regZip of the on-disk dir (bundle is the source).

## PM routing log
| # | Stage | Agent | Verdict | Note |
|---|-------|-------|---------|------|
| 1 | dev | main | done | zip route + shared session helper + client Download button |
| 2 | qa | full gate | PASS | + live: route mounted, 401 unauth. End-to-end download needs user login. |

## Outcome
DONE. `GET /api/apps/:id/demo.zip` (jszip, in-memory from bundle.files, auth-scoped).
Refactored session reading into `session.ts` (shared by tRPC + route). Download button
in BundleView; Generator now tracks the whole Application. Gate PASS.
Note: `pnpm install` for a new dep must NOT use `CI=true` (forces --frozen-lockfile).
