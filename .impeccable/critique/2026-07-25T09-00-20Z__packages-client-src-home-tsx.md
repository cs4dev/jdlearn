---
target: packages/client/src/Home.tsx
total_score: 35
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 0
timestamp: 2026-07-25T09-00-20Z
slug: packages-client-src-home-tsx
---
Method: dual-agent (A: design review · B: detector; browser degraded — dev server down)
Target: packages/client/src/Home.tsx (5th pass; all remaining P2/P3 fixed)

## Design Health Score — 35/36 applicable (H10 n/a) — 97%, Excellent

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Visibility of System Status | 4 | post-signup beat + aria-live progress + aria-hidden skeleton |
| 2 | Match System / Real World | 4 | natural verdict/fit language |
| 3 | User Control and Freedom | 4 | edit/cancel, toggle, retry, delete confirm |
| 4 | Consistency and Standards | 4 | token seams closed (indigo-600 eyebrow, text-2xl H1) |
| 5 | Error Prevention | 4 | delete modal, minLength, disabled-on-empty |
| 6 | Recognition Rather Than Recall | 4 | Example badge removed the last recall trap |
| 7 | Flexibility and Efficiency | 3 | email + Google; no shortcuts (not expected) |
| 8 | Aesthetic and Minimalist | 4 | one-accent held; Example pill neutral gray not a 4th hue |
| 9 | Error Recovery | 4 | inline Try again, plain-language messages |
| 10 | Help and Documentation | n/a | self-evident single-task tool |

Trend: 27/40 (68%) -> 28/36 (78%) -> 29/36 (81%) -> 32/36 (89%) -> 35/36 (97%). Acceptable -> Excellent. P0/P1/P2/P3 cleared to near-zero. Cognitive-load failures 1 -> 0 (Example badge closed the last).

## Verdict — surface essentially done
All six prior fixes verified in source by A (not just claimed). A11y correct end-to-end (h1->h2->h2 outline, decorative skeleton hidden, live-region progress, labeled controls). Token discipline real (Example pill uses gray, not a 4th color). Detector steady at 2 hits, both documented-intentional indigo (FitMap.tsx score, NotFound.tsx).

## What's Working
1. Proof-first landing via shared FitMap (demo can't drift) + honest Example badge.
2. Accessibility quietly correct end-to-end.
3. Token discipline real not aspirational.

## Priority Issues (remaining, all fixed in the mop-up commit)
- [P2] Post-signup beat skipped Google path -> FIXED (Google onPress now sets the flag, cleared on error).
- [P3] Stale comments referencing "· example" subtitle -> FIXED (reference isExample badge).
- [minor] Example badge text-[0.7rem]/tracking-wide -> FIXED (text-xs/tracking-wider to match label).
- (Fit-map-wider-than-auth-card asymmetry is per the DESIGN auth-card token — intended.)

## Persona Red Flags
- Jordan: no red flag; scans hero->fit map->CTA in one pass.
- Sam/new-grad: 82-as-own-verdict resolved by Example badge.
- Casey/a11y: h3-before-h2 + skeleton aria resolved.
