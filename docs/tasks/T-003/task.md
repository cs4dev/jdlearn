# T-003 — past applications list/reopen UI (fast track)

**Acceptance:** SPEC §8 #6 — past applications listed and reopened, scoped to the user.

## Scope
The basic list/reopen shipped in T-001. This task polishes it:
- Replace the HeroUI `Listbox` with plain rows (full control over per-row actions).
- **Soft delete** an application (new `deleteApplication` tRPC mutation, owner-scoped),
  behind a double-confirm modal naming the role. Deleting the currently-viewed app
  clears the view.
- Highlight the currently-viewed row.

## Soft delete
`Application.deletedAt` (ISO string, optional). Delete sets it via `updateOne`; reads
(`list`/`get`) filter `deletedAt: null` (matches null + missing in Mongo). Docs stay in
the collection — recoverable, audit-friendly.

## Out of scope
Search/filter, an "undo"/restore UI (the data is retained; surface later if wanted).

## Changes
- `shared/application.ts` — `deletedAt: z.string().nullish()`.
- `server/repository.ts` — soft-delete `updateOne`; `list`/`get` exclude soft-deleted.
- `server/trpc.ts` — `deleteApplication` protected mutation.
- `client/Generator.tsx` — rows with reopen + delete button → confirm modal; active highlight.

## Verification
Gate (`harness/validate.sh --no-boot`) PASS. Mutation matches `{ userId, id }`, so one
user can't delete another's application. Live-verified in browser: confirm modal →
Delete removes the row from the list (doc retained in Mongo).
