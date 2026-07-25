---
target: packages/client/src/Home.tsx
total_score: 29
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-07-25T08-29-37Z
slug: packages-client-src-home-tsx
---
Method: dual-agent (A: design review · B: detector + browser)
Target: packages/client/src/Home.tsx (proof-first two-column landing; 3rd pass)

## Design Health Score — 29/36 applicable (H10 n/a) — Good (81%)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | BundleSkeleton + staged GeneratingStatus (aria-live) shape the 60s wait |
| 2 | Match System / Real World | 3 | "Upload your résumé" mis-states build-or-import |
| 3 | User Control and Freedom | 3 | toggle, mode switch, modal cancel |
| 4 | Consistency and Standards | 3 | → on Sign up + Google mark up; docked for sample!=real duplication |
| 5 | Error Prevention | 3 | minLength, disabled-on-empty, delete confirm |
| 6 | Recognition Rather Than Recall | 4 | sample shows the mechanism |
| 7 | Flexibility and Efficiency | 3 | Google one-click, keyboard inputs |
| 8 | Aesthetic and Minimalist | 4 | emoji purged -> hairline SVGs |
| 9 | Error Recovery | 2 | generic "Something went wrong" / raw error passthrough — UNMOVED, lone weak link |
| 10 | Help and Documentation | n/a | Persuade landing; inline microcopy substitutes |

Trend: 27/40 (68% Acceptable) -> 28/36 (78% Good) -> 29/36 (81% Good). P0: 1 -> 0 -> 0. Gains concentrated: H1 (skeleton), H8 (emoji gone), H4 (→ + Google mark). Net only +1 because H9 (errors) didn't move and now stands alone at 2.

## Design Specificity Verdict
Authored for jdlearn, more convincingly than prior passes. Proof-first landing = right architecture (both assessments agree). Detector unchanged: 3 ai-color-palette, all documented-intentional; new multicolor Google logo not flagged. Browser confirmed two-column render, equal-height aligned cards, hairline eye, official Google mark, Sign up →. Remaining seams are finish-level: hero subhead "Upload your résumé" (wrong+generic vs build-or-import); SampleFitMap is a hand-rolled twin of BundleView, already diverging (bare li vs nested Card).

## What's Working
1. Proof-first landing (actual fit map, mobile stacks proof->form).
2. Generation wait honest+shaped (skeleton mirrors payload, staged status = real fit-first pipeline, holds on last step).
3. Icon+palette discipline clean (emoji gone, stroke SVGs, official Google mark, verdict-only color).

## Priority Issues (remaining)
- [P1] Generic/raw errors (H9, lone weak link). AuthForm "Something went wrong"; Generator raw generate.error.message. Highest-stakes moments = dead-end string, no next step. Fix: map Better Auth codes to recoverable copy; wrap generate error with retry. -> harden
- [P1] SampleFitMap duplicates BundleView (Home.tsx:34-82 vs BundleView:95-139). Two codepaths guarantee drift (already diverging). Fix: extract shared FitMap/FitRow, feed sample static fitAnalysis. -> extract
- [P2] Hero subhead "Upload your résumé" wrong+generic (Home.tsx:132). Fix: mirror gate card "build it or import a PDF". -> clarify
- [P2] Post-signup résumé gate is an unpromised interrupt — new user's first screen is "Add your résumé first" not the promised generator. Fix: set expectation on landing or route signup into builder. -> clarify/onboard
- [P3] Redundant sample closing line restates subhead; two-column right col (max-w-sm + justify-center) asymmetric vs fit-map cell. -> layout

## Persona Red Flags
- Jordan: signs up to paste a JD, hits résumé gate = bait-and-switch under time pressure.
- Casey: "· example" tag is a tiny gray suffix; skimmer could read 82/100 as their score. Consider visible "Sample" chip.
- Riley: mostly served (AA contrast, aria-labels, aria-hidden icons); residual: BundleSkeleton silent — add aria-busy/label.

## Minor / Questions
- AuthForm:64 mixes className shadow-sm with shadow="none" prop.
- BundleView:88 eyebrow indigo-500 (logo-gradient secondary) vs DESIGN primary-indigo spec.
- Signed-in H1 text-3xl != Display/Headline tokens.
- Should signup route résumé-less user into builder? Should sample carry a visible "Sample" chip?
