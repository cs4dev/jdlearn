# T-011 — permanent delete on archived applications

**Track:** full (destructive/irreversible on user data + SPEC scope change + R12 escape hatch).
**SPEC:** v3.4 §2, §5 (`purgeApplication`), §8 #13. **RULES:** R12 hard-delete escape hatch.
**Motivation:** archived apps accumulate forever (soft delete never purges). Give users a
way to permanently remove one.

## Scope
- `purgeApplication(userId, id)` (repository): real `deleteOne`, owner-scoped AND restricted
  to `deletedAt: { $ne: null }` — only ALREADY-archived rows can be purged; a live app can
  never be hard-deleted through this path. Carries the R12 `// hard-delete: SPEC §5` marker.
- tRPC `purgeApplication` protected mutation.
- Client: "Permanently delete" button per archived row → double-confirm modal → purge;
  removes from the archive; page redirect-when-empty guard accounts for in-flight purge.

## Out of scope
Bulk purge / "empty archive"; auto-purge after N days; purging live (non-archived) apps.

## Acceptance (binary)
- [ ] "Permanently delete" on an archived app hard-deletes it (owner+archived-scoped),
      behind a confirm modal; it leaves the archive and is not restorable (§8 #13).
- [ ] A live (non-archived) application cannot be purged via `purgeApplication`
      (query filter `deletedAt: { $ne: null }`).
- [ ] R12 gate still green — the only `deleteOne` in server src carries the
      `// hard-delete: SPEC §5` marker.
- [ ] `harness/validate.sh` exits 0.

## Verification
Gate PASS (incl. R12 grep). Live per-user Mongo purge + confirm-modal click are
manual-verify (need DB/browser).
