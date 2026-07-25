---
target: packages/client/src/Home.tsx
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-25T07-37-06Z
slug: packages-client-src-home-tsx
---
Method: dual-agent (A: design review · B: detector evidence)
Target: packages/client/src/Home.tsx (signed-out landing + signed-in generator)

## Design Health Score — 27/40 (Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | ~60s generation: spinner + one gray line, no skeleton/progress |
| 2 | Match System / Real World | 3 | "fit map" absent from the landing |
| 3 | User Control and Freedom | 3 | 60s Generate can't be aborted |
| 4 | Consistency and Standards | 3 | Emoji break emoji-free system-font aesthetic; AuthForm defaults to sign-in |
| 5 | Error Prevention | 3 | minLength, disabled-until-nonempty, delete confirm — solid |
| 6 | Recognition Rather Than Recall | 4 | Outside labels, visible fields |
| 7 | Flexibility and Efficiency | 2 | No keyboard path to Generate |
| 8 | Aesthetic and Minimalist | 3 | Clean but shows the visitor no sample/imagery |
| 9 | Error Recovery | 2 | Raw error.message in 3 places, no guidance |
| 10 | Help and Documentation | 2 | No explanation of what a fit map is |

## Design Specificity Verdict
Signed-in app is genuinely jdlearn (mono JD input, → motif, gerund loading, résumé gate). Signed-out landing is category-interchangeable on the exact axis that is the moat: the fit map is neither shown nor named before signup (Home.tsx:10 perks = résumé/cover-letter/plan). Detector: 3 findings, all ai-color-palette (BundleView.tsx:100, Home.tsx:74, NotFound.tsx:10), all documented-intentional per DESIGN.md's One-Accent rule — not defects. Convergence: detector says palette is on-spec; design review says the on-spec palette + generic perks make the landing generic. The real defect (invisible differentiator) is one no detector catches. Browser overlay unavailable (Chrome extension not connected).

## What's Working
1. Résumé-gate card (Generator.tsx:52) — empty state as onboarding.
2. Generator discipline — mono input, disabled-until-valid, gerund loading, → motif.
3. Fit-map component (BundleView.tsx) — verdict chips + indigo score; color = conclusion.

## Priority Issues
- [P0] Fit map invisible before signup (Home.tsx:10). Fix: lead left column with a real-looking fit-map sample (score /100 + Match/Partial/Gap chips). → bolder + clarify
- [P1] Auth greets new visitors "Welcome back" (AuthForm.tsx:6 defaults signin). Fix: default signup on landing. → onboard
- [P1] No feedback during ~60s generation (Generator.tsx:92). Fix: fit-map skeleton (Skeletons.tsx) + staged status; consider abort. → animate
- [P2] Emoji undercut the system (📄📝🎯 coins, 🙈👁 toggle, ✕). Fix: inline SVG glyphs mirroring Logo stroke. → polish
- [P3] No trust cue before signup; no ⌘/Ctrl+Enter submit. Fix: privacy line near CTA; bind keyboard submit. → delight

## Persona Red Flags
- Jordan: "Welcome back" on first visit; account before product; never learns "fit map"; résumé-required surprise post-signup.
- Sam: text-gray-400 (#9ca3af) micro-copy on white ~2.5:1, fails WCAG AA small text.
- Alex: pointer-only repeat loop; no keyboard Generate/Regenerate.

## Minor Observations
- Signed-in H1 reuses marketing tagline every session (Home.tsx:48).
- Auth card min-h-[30rem] causes long mobile scroll.
- No generation-wait skeleton despite PageSkeleton existing elsewhere.

## Questions
1. Static sample fit map (no account) on the landing?
2. Sequence pitch → proof → form down one column vs two-column read-and-fill?
3. 60s generation: spinner vs skeleton/staged progress?
