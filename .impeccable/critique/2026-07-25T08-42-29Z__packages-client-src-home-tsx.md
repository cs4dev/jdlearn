---
target: packages/client/src/Home.tsx
total_score: 32
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 0
timestamp: 2026-07-25T08-42-29Z
slug: packages-client-src-home-tsx
---
Method: dual-agent (A: design review · B: detector + browser)
Target: packages/client/src/Home.tsx (4th pass; shared FitMap, hardened errors, clarified subhead)

## Design Health Score — 32/36 applicable (H10 n/a) — 89%, top of Good

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | silent post-signup transition; BundleSkeleton lacks aria-busy |
| 2 | Match System / Real World | 4 | subhead now names build-or-import flow |
| 3 | User Control and Freedom | 4 | toggle, show/hide, cancel, retry |
| 4 | Consistency and Standards | 3 | sample==real (shared FitMap); two token seams left |
| 5 | Error Prevention | 4 | minLength, required, disabled-on-empty |
| 6 | Recognition Rather Than Recall | 4 | labels + verdict words |
| 7 | Flexibility and Efficiency | 3 | Google SSO + retry |
| 8 | Aesthetic and Minimalist | 3 | caption removed; docked for quiet "· example" |
| 9 | Error Recovery | 4 | context-aware auth copy + Generation-didn't-finish + Try again |
| 10 | Help and Documentation | n/a | single-purpose task tool |

Trend: 27/40 (68%) -> 28/36 (78%) -> 29/36 (81%) -> 32/36 (89%). P0 1->0->0->0; P1 remaining 0. All 3 targeted heuristics moved: H2+1 (subhead), H4+1 (sample=real shared), H9+1 (errors).

## Design Specificity Verdict
Category-defeating. SampleFitMap (Home) renders the SAME FitMap component as BundleView, fed a real FitAnalysis object — demo/reality drift impossible. Detector 3->2: the two indigo-score hits merged into shared FitMap.tsx:32; both remaining hits documented-intentional (FitMap.tsx:32 score, NotFound.tsx:10). Browser confirmed new subhead, Sign up →, equal-height cards, honest Gap row.

## What's Working
1. Sample is the product, rendered by the product (shared FitMap) — kills drift at source.
2. Error recovery honest+actionable (branched auth copy; generate Try again).
3. Palette/icon discipline holds (verdict-only color, emoji gone, AA text, danger wash only on errors).

## Priority Issues (remaining, all P2/P3)
- [P2] "· example" too quiet — real-shaped sample; fatigued scanner reads 82/100 as own score. Fix: visible neutral "Example" chip by the "Fit for this role" label (consider explicit isExample/badge prop on FitMap). -> clarify
- [P2] Eyebrow reserved secondary hue. BundleView:77 "Tailored for" text-indigo-500 (#6366f1, logo-gradient only) vs DESIGN eyebrow = Desk Indigo indigo-600. Fix: indigo-500 -> indigo-600. -> colorize
- [P3] BundleSkeleton lacks aria-busy; also landing heading order h3 (FitMap) before h2 (AuthForm). -> harden (a11y)
- [P3] Silent post-signup transition — no "account created" beat before résumé gate. -> clarify (first-run)
- [P3] Signed-in H1 text-3xl vs DESIGN Headline ~1.5rem. -> typeset or codify variant in DESIGN.md

## Persona Red Flags
- Jordan: reads "82" first, "example" second (P2 misread).
- Sam/Riley: BundleSkeleton no aria-busy; h3-before-h2 heading order on landing. Keyboard/focus sound.
- Casey (skeptic): best-served — honest Gap row in the marketing sample is the strongest trust signal.

## Minor / Questions
- FitMap subtitle is stringly-typed; "example" semantics only in the string. Add explicit isExample/badge prop when doing P2.
- Is signed-in H1 text-3xl an intentional app variant (codify in DESIGN.md) or drift?
- Post-signup: is an "account created" beat in scope, or is the gate the only first-run ack?
