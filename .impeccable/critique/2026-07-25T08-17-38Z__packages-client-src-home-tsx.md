---
target: packages/client/src/Home.tsx
total_score: 28
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-07-25T08-17-38Z
slug: packages-client-src-home-tsx
---
Method: dual-agent (A: design review · B: detector + browser)
Target: packages/client/src/Home.tsx (rebuilt landing: hero + two-column sample fit map / signup)

## Design Health Score — 28/36 applicable (H10 n/a) — Good (78%)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | landing static, no motion |
| 2 | Match System / Real World | 4 | fit map / match-partial-gap / proof = the model is the product |
| 3 | User Control and Freedom | 3 | toggle + show-password work |
| 4 | Consistency and Standards | 3 | → missing on Sign up button; sample label gray-500 vs real gray-400 |
| 5 | Error Prevention | 3 | minLength 8 + hint |
| 6 | Recognition Rather Than Recall | 4 | sample shows the mechanism |
| 7 | Flexibility and Efficiency | 3 | homemade G badge |
| 8 | Aesthetic and Minimalist | 3 | emoji + G badge break flat discipline in conversion card |
| 9 | Error Recovery | 2 | one red line / generic "Something went wrong" |
| 10 | Help and Documentation | n/a | Persuade landing |

Trend: 27/40 (68% Acceptable) -> 28/36 (78% Good). Different denominators (H10 n/a this run); percentage improvement is real, driven by the sample fit map (H2/H6) + signup-default fix (H4).

## Design Specificity Verdict — moat now visible
Surfacing SampleFitMap put jdlearn's irreproducible mechanism (JD<->resume, match/partial/gap, 82/100) in the first viewport pre-signup, mirroring the real BundleView. Honest red Gap builds trust. Detector: 3 hits ai-color-palette, all documented-intentional; the old Home.tsx:74 violet gradient tell is GONE (now plain indigo heading at line 46). Browser confirmed two-column render, verdict colors only on chips, no overflow.

## What's Working
1. Sample fit map — shows not tells, mirrors real component, honest (labeled example, real gap), verdict-only color.
2. On-brand discipline; landing dropped gray-400 -> gray-500/600 (Sam contrast fixed here).
3. Trust-forward auth — signup default, privacy line, h-full stretch = one composed unit.

## Priority Issues
- [P1] Emoji in conversion+generator (was P2). 🙈👁 toggle (AuthForm.tsx:65), homemade G badge, ✕ delete (Generator.tsx:176) — break flat identity at highest-trust moments; G is non-official mark. Fix: stroke SVGs / official Google mark. -> polish
- [P1] Generation wait unshaped (carried). ~60s spinner + one gray-400 line (Generator.tsx:94); no skeleton. Fix: bundle-shaped skeleton + staged microcopy (Skeletons.tsx exists). -> animate
- [P2] text-gray-400 fails WCAG AA off the landing (auth divider; signed-in Generator timestamps/hints, BundleView SectionLabel + /100). The DESIGN "Faint = #9ca3af" token bakes in the failing value. Fix: token -> #6b7280. -> audit
- [P2] → motif + label drift between sample and real fit map. Sign up lacks →; sample label gray-500 vs real gray-400. Fix: add → to signup; unify label token. -> clarify

## Persona Red Flags
- Jordan: understands product pre-commit (win); but sample says "your plan" for a fictional role, and post-signup hits unshaped 60s wait.
- Sam: brand's own SectionLabel (gray-400) is the contrast offender; password toggle uses emoji (aria-label present).
- Casey: order correct (hero -> fit map -> form); watch w-16 chip + 2-line evidence at ~360px.

## Minor / Questions
- Sample duplicates BundleView row markup instead of reusing it — that's why label-color drift exists; shared sub-component would keep demo+real in lockstep.
- Verify two cards feel balanced (h-full + justify-center) not "form marooned in whitespace".
- Should sample speak third-person ("their plan")? Is Faint=#9ca3af due for revision to #6b7280?
