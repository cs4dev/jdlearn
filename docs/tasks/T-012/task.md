# T-012 — résumé import: Markdown + drag-and-drop

**Track:** fast (additive to existing import; no new dep, no schema change).
**SPEC:** v3.5 §2.5, §8 #11.
**Motivation:** broaden import — many keep résumés as Markdown/plain text — and make the
control drag-and-drop, not just a button.

## Scope
- Server (`resume-parse.ts`): accept `.md`/`.markdown`/`.txt` → read as UTF-8 (no
  unpdf/mammoth), then the same Claude structuring. Unsupported-type error message updated.
- Client (`ResumeBuilder.tsx`): import control is a dashed drop zone — drag a file OR click
  to browse; `accept` includes the new types; drag-over highlight; shared `handleFile`
  path for both input-change and drop.

## Out of scope
Multi-file import; pasting résumé text directly; server MIME sniffing beyond the existing
%PDF check (extension-based, consistent with prior behavior).

## Acceptance (binary)
- [ ] A `.md`/`.txt` file imports (text read as-is → Claude structures → prefills builder).
- [ ] PDF/DOCX still work; unsupported type still errors clearly.
- [ ] Drag-and-drop and click-to-browse both import; rate limit (v3.3) still applies.
- [ ] `harness/validate.sh` exits 0.

## Verification
Gate PASS. Live extraction of a real .md/.pdf and the drag gesture are manual-verify
(need key/browser).
