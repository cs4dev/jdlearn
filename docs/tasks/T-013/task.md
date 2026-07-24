# T-013 — JD↔résumé fit map (the core connection)

**Track:** full (frozen `GenerationBundle` reshape — RULES R3; SPEC major bump v4).
**SPEC:** v4 §1, §3 (FitAnalysis/FitRequirement), §4 (fit-first generation), §8 #2/#14.
**Motivation:** the app's moat is the explicit connection between the résumé and the JD.
It was implicit (buried in cover-letter prose + plan). Make it a structured, first-class
output that the cover letter and plan derive from.

## Scope
- Frozen schema (`bundle.ts`): `GenerationBundle.fitAnalysis` (required) =
  `{ overallFit 0–100, summary, requirements[] }`; `FitRequirement =
  { text, status: match|partial|gap, evidence, gapNote }`. Tests updated (+2).
- Generation (`anthropic.ts`): prompt builds FIT-FIRST — extract JD requirements, map each
  to résumé evidence (match/partial/gap), then derive cover letter (matches lead) + plan
  (closes gaps) from it; tool schema + `required` include `fitAnalysis`. Status grounded
  only in résumé; no-résumé → all gaps.
- UI (`BundleView.tsx`): "Fit for this role" section first — score + per-requirement chips
  (match=success/partial=warning/gap=danger) + evidence/gapNote. Guarded so pre-v4 stored
  bundles (no `fitAnalysis`) still render.

## Out of scope
Per-requirement links from a gap to the exact plan step (the plan already targets gaps);
editing/overriding the fit map; standalone "analyze fit without generating" endpoint.

## Acceptance (binary)
- [ ] Bundle requires `fitAnalysis` (overallFit 0–100, ≥1 requirement); missing → rejected
      (§8 #2, unit-tested).
- [ ] Generation prompt/tool emit fitAnalysis and derive cover letter + plan from it.
- [ ] Fit section renders for v4 bundles; pre-v4 bundles (no fitAnalysis) don't crash (§8 #14).
- [ ] R3 honored — single schema definition; R5 intact.
- [ ] `harness/validate.sh` exits 0.

## Verification
Gate PASS; schema tests cover required fitAnalysis + score range. Live fit quality (does
the model map requirements sensibly, ground status in résumé) needs a real key — manual-verify.
