# T-007 — candidate résumé (personalized generation)

**Track:** full (new schema + persistence + SPEC scope change + cross-package contract).
**SPEC:** v3 §2.4, §3 (Resume), §4 (personalized generation), §5, §8 #8–#10.
**Motivation:** cover letters read generic because the model only saw the JD, nothing
about the candidate. A per-user résumé feeds generation so output is written from real
history.

## Scope
- `Resume` schema + `resumeToMarkdown` (shared, tested). NOT part of the frozen
  `GenerationBundle` — the bundle output shape is unchanged (R3 intact).
- Per-user résumé persistence: one doc, `replaceOne … upsert` keyed by `userId`.
- tRPC `getResume` / `saveResume` (stamps `updatedAt`).
- `generate` loads the caller's résumé and passes it to the prompt; cover letter drawn
  from real history, must not invent experience; plan judges gaps vs. résumé.
- Client: `/resume` structured builder (contact, summary, experience[], education[],
  skills) with add/remove entries, save, markdown export; "Résumé" nav link.

## Out of scope
PDF export (markdown only; browser print covers PDF), résumé import/parse from file,
multiple résumé versions.

## Acceptance (binary)
- [ ] Résumé with non-empty `fullName` saves + reloads; empty `fullName` rejected (§8 #8).
- [ ] With a résumé stored, `generate` includes it in the prompt; without one, still
      succeeds generically (§8 #9).
- [ ] Résumé exports as markdown (§8 #10).
- [ ] Bundle output schema unchanged; existing acceptance #1–#7 still hold.
- [ ] `harness/validate.sh` exits 0.

## Verification
Gate PASS. Résumé schema + markdown unit-tested (`resume.test.ts`). Live generate-with-
résumé needs a real key + DB (not gate-covered) — verify manually.
