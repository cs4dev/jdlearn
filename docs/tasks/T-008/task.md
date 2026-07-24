# T-008 — résumé import (PDF / DOCX)

**Track:** full (new external deps + new procedure + SPEC scope change).
**SPEC:** v3.1 §2.5, §5 (`importResume`), §7, §8 #11.
**Motivation:** typing a résumé from scratch is friction; let users upload an existing
PDF/Word doc and have it structured into the builder.

## Scope
- Server text extraction: `unpdf` (PDF), `mammoth` (DOCX). ≤5MB. `resume-parse.ts`.
- Claude structured extraction → validated `Resume` (reuses the existing schema; the
  model is told to use ONLY text present, never invent). Anthropic stays server-only (R5).
- tRPC `importResume({ filename, dataBase64 }) → Resume` — returns, does NOT persist.
- Client: "Import PDF / Word" button in the builder → prefills the form for review; user
  edits then Saves (never auto-overwrites stored résumé).

## Out of scope
Auto-save on import; formats beyond PDF/.docx; server-side file storage (bytes are parsed
in-memory and discarded).

## Acceptance (binary)
- [ ] Upload PDF or DOCX → `importResume` returns a `Resume` (valid schema) that fills the
      builder fields, unsaved (§8 #11).
- [ ] Unsupported file type → clear error, no crash; key unset → clear error (§8 #11).
- [ ] Import does not persist; existing résumé unchanged until the user hits Save.
- [ ] R5 (Anthropic server-only) intact; `Resume` schema unchanged.
- [ ] `harness/validate.sh` exits 0.

## Verification
Gate PASS. Live extraction + Claude parse needs a real key + a sample file (not gate-
coverable) — verify manually with a PDF and a .docx.
