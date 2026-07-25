---
name: jdlearn
description: Turn a job post into proof — a fit map, cover letter, and learning plan from your real résumé.
colors:
  primary: "#4f46e5"
  primary-strong: "#4338ca"
  accent-violet: "#8b5cf6"
  accent-indigo-bright: "#6366f1"
  tint-50: "#eef2ff"
  tint-100: "#e0e7ff"
  surface: "#ffffff"
  page: "#f9fafb"
  ink: "#111827"
  ink-soft: "#1f2937"
  muted: "#4b5563"
  muted-soft: "#6b7280"
  faint: "#6b7280"
  hairline: "#f3f4f6"
  divider: "#e5e7eb"
  on-primary: "#ffffff"
  verdict-match: "#17c964"
  verdict-partial: "#f5a524"
  verdict-gap: "#f31260"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  md: "8px"
  lg: "12px"
  card: "14px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    typography: "{typography.body}"
    padding: "0 16px"
  button-flat:
    backgroundColor: "{colors.tint-100}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
  button-light:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
  button-bordered:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
  input-bordered:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  chip-verdict:
    backgroundColor: "{colors.tint-50}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: jdlearn

## Overview

**Creative North Star: "The Evidence Desk"**

jdlearn is a workspace for turning a claim into proof. The visitor arrives with a
job description and a history, and the interface's whole job is to lay the two
side by side and render a verdict — match, partial, gap — then build the paperwork
from it. So the surface behaves like a calm analyst's desk: a single centered
column of white document-surfaces on a soft gray page, warmed by one faint indigo
glow bleeding down from above the fold, as if a desk lamp were on. Nothing shouts.
The chrome recedes so the reasoning — the fit map, the letter, the plan — is the
only thing with color and weight.

This is an **Operate** surface: the user is completing a task under
application-fatigue pressure, so scanability and trust outrank expression. Density
is generous, not cramped — sections breathe on 32px rhythm, cards carry a single
hairline border instead of heavy shadow, and hierarchy is carried by weight and an
uppercase micro-label rather than by boxes and rules. The brand lives in the
precise details: the tracked section labels, the indigo eyebrow above the role
title, the arrow that trails every forward action, the numbered indigo coins of
the learning plan.

The palette is deliberately narrow: one indigo accent, a full gray neutral ramp,
and three semantic verdict colors that appear *only* on fit chips. Color is
evidence here, not decoration — a splash of green or red means the system reached a
conclusion, never that a designer wanted contrast.

**Key Characteristics:**
- Single centered document column on a warm-gray page with one indigo overhead glow.
- Flat by default: hairline borders (`#f3f4f6`) do the work shadows usually do.
- One indigo accent + full gray ramp; verdict colors reserved for fit judgments.
- Hierarchy from weight + uppercase tracked micro-labels, not from heavy containers.
- Quiet, system-font typography; monospace only where the user pastes raw JD text.

## Colors

A disciplined one-accent palette: indigo carries every interactive and brand
moment, grays carry all structure and text, and three semantic colors are held in
reserve for the fit verdict and error states.

### Primary
- **Desk Indigo** (`#4f46e5`): The single brand accent. Solid primary buttons, the
  focus ring, the overall-fit score, active-row tint, the eyebrow above the role
  title, links, and the learning-plan resources. This is the only chromatic voice
  in the standard UI.
- **Indigo Pressed** (`#4338ca`): The darker step for hover/active on primary
  surfaces.

### Secondary
- **Bright Indigo** (`#6366f1`) and **Signal Violet** (`#8b5cf6`): Used *only* as
  the two stops of the logo/identity gradient (top-left → bottom-right) and the
  small perk-icon coins on the landing page. Not for UI chrome.

### Neutral
- **Ink** (`#111827`): Primary text, headings, emphasized inline words.
- **Ink Soft** (`#1f2937`): Body copy inside document surfaces (cover letter).
- **Muted** (`#4b5563`) / **Muted Soft** (`#6b7280`): Supporting sentences,
  descriptions, summaries.
- **Faint** (`#6b7280`): Micro-labels, timestamps, secondary hints, "/ 100". Raised
  from `#9ca3af` so the signature tracked label clears WCAG AA (~4.6:1 on white);
  it now coincides with Muted Soft, which is intentional — the faint step was below
  the contrast floor and had to come up.
- **Page** (`#f9fafb`): The app background, and the recessed cover-letter panel.
- **Surface** (`#ffffff`): Every card and elevated document.
- **Hairline** (`#f3f4f6`): The default card border and list dividers — the workhorse edge.
- **Divider** (`#e5e7eb`): Slightly stronger rules (the auth "or" separator, `<Divider>`).
- **Tints** (`#eef2ff` / `#e0e7ff`): Indigo washes for the fit chips, plan coins,
  the "add your résumé" prompt card, and flat-button fills.

### Tertiary — Verdict colors (reserved)
- **Match Green** (`#17c964`), **Partial Amber** (`#f5a524`), **Gap Red** (`#f31260`):
  The three fit statuses, as flat HeroUI chips. Gap Red doubles as the error/danger
  color (destructive actions, error toasts on a `danger-50` wash).

### Named Rules
**The Evidence-Only Color Rule.** Green, amber, and red appear *only* as a fit
verdict or a system error — never as decoration, category tags, or emphasis. If a
color that isn't indigo or gray shows up, it must mean the system reached a
conclusion.

**The One-Accent Rule.** Indigo is the sole brand hue. Don't introduce a second
decorative accent; reach for weight, size, or a gray step before reaching for a new color.

## Typography

**Display / Body Font:** System UI stack (`ui-sans-serif, system-ui, -apple-system,
Segoe UI, Roboto, …`). No web font is loaded — the tool favors instant paint and a
native, unbranded neutrality over a typographic signature.
**Mono Font:** System monospace stack (`ui-monospace, SFMono-Regular, Menlo, …`),
used exclusively for the JD paste area, where the user is handling raw source text.

**Character:** Quiet and functional. Personality comes from *how* the scale is used
— tight negative tracking on large headings, and a distinctive uppercase, wide-tracked
micro-label — not from the letterforms themselves.

### Hierarchy
- **Display** (800, `clamp(2.25rem → 3rem)`, tight `-0.02em`): The landing hero only
  — "Turn a job post into proof." with "proof." set in indigo.
- **Headline** (700, ~1.5rem, `-0.02em`): The signed-in H1 and the role title in a bundle.
- **Title** (600–700, 1.125–1.25rem): Card headings — "Add your résumé first",
  "Welcome back".
- **Body** (400, 0.875rem, `line-height 1.625`): The default. Descriptions, summaries,
  the cover letter, fit-requirement text. Cover-letter prose runs relaxed for reading.
- **Label** (600, 0.75rem, uppercase, `letter-spacing 0.05em`, color Faint): The
  signature. Section headers ("Fit for this role", "Cover letter", "Learning plan",
  "Past applications") and the indigo "Tailored for" eyebrow.
- **Mono** (400, 0.875rem): JD textarea input only.

### Named Rules
**The Tracked-Label Rule.** Every section is introduced by an uppercase,
wide-tracked, 12px label in Faint gray (or indigo for the role eyebrow) — never by a
bold sentence-case heading. This micro-label is the system's typographic signature;
keep it consistent across every new section.

## Layout

A single centered reading column, never a full-bleed dashboard. Containers step by
role: `max-w-3xl` (768px) for the working app, `max-w-4xl` (896px) for the header
and the two-column landing split, `max-w-sm` (384px) for the auth card. Horizontal
gutters are a constant `24px` (`px-6`).

Vertical rhythm is deliberate: major sections stack on a `32px` (`space-y-8`)
cadence; card interiors use `16–32px` gaps; related items (chip ↔ text, coin ↔
step) sit `12px` apart. The signed-out landing is a two-column grid on `md+` (pitch
left, auth card right) that collapses to a single centered stack on mobile.

The page carries one atmospheric element: a large soft **radial indigo glow**
(`radial-gradient(55rem 40rem at 50% -16rem, indigo-100, transparent)`) bleeding
down from above the top edge onto the gray page — the desk lamp. It is the only
background treatment; the rest is flat `#f9fafb`.

## Elevation & Depth

**Flat by default, bordered for structure.** This system almost never uses shadow to
separate surfaces — it uses a single hairline border (`1px #f3f4f6`) and the white/gray
surface contrast. Primary document cards carry HeroUI `shadow="sm"` as a barely-there
lift; nested cards (a fit-requirement row inside the bundle, the past-applications
list) drop to `shadow="none"` and rely on border + tint alone. Depth is layered, not
lifted.

### Shadow Vocabulary
- **Rest lift** (`shadow-sm`, HeroUI `sm`): The only ambient shadow — top-level cards
  and the logo coin. Signals "this is a document," not "this is floating."

### Named Rules
**The Hairline-First Rule.** To separate two surfaces, add a `#f3f4f6` border before
you add a shadow. Nested surfaces get border only (`shadow="none"`). A second stacked
shadow is a smell — flatten it.

## Shapes

Soft, generous corners with no sharp edges anywhere. The radius vocabulary:
`8px` (buttons, error/notice boxes, the logo tile), `12px` (the recessed cover-letter
panel), `~14px` (HeroUI cards, the primary containers), and full-round (`9999px`) for
the verdict chips, the numbered learning-plan coins, and the small gradient perk
icons. Circles carry status and sequence (the plan's 1-2-3 coins, the "G" auth
badge); rounded rectangles carry documents. Borders are always `1px` and hairline —
there are no thick strokes, no dividers heavier than `1px`.

## Components

### Buttons
- **Shape:** Rounded (`~12px`), medium weight label, compact height; `size="sm"` is the
  common size in dense areas (nav, card actions).
- **Primary:** Solid Desk Indigo (`#4f46e5`) on white text — the one high-emphasis
  action per view (Generate, Sign in, Add your résumé). Forward actions carry a
  trailing **→** (`endContent`); this arrow is a brand motif, not decoration.
- **Flat:** Indigo text on an indigo-100 wash — secondary in-context actions (Copy,
  Edit, Regenerate).
- **Light:** Transparent, muted-gray text — the quietest tier, used for header nav
  (Résumé, Archived, Sign out) and Cancel.
- **Bordered:** White with a hairline border — neutral alternates like "Continue with
  Google."
- **Hover / State:** Indigo deepens toward `#4338ca`; disabled fades; `isLoading`
  swaps the label to a present-tense gerund ("Generating…", "Saving…").

### Cards / Containers
- **Corner Style:** ~14px (HeroUI large).
- **Background:** White surface; the "add your résumé" prompt uses an `indigo-50/40`
  tint with an `indigo-100` border to read as a gentle nudge.
- **Shadow Strategy:** `shadow="sm"` for primary cards, `shadow="none"` for nested —
  see Elevation.
- **Border:** Always `1px` hairline (`#f3f4f6`).
- **Internal Padding:** `20–24px` (`p-5`/`p-6`); body gaps `16–32px`.

### Inputs / Fields
- **Style:** HeroUI `variant="bordered"`, outside-placed label, ~12px radius. The JD
  textarea overrides the input font to **monospace** to signal raw source text.
- **Focus:** Indigo focus ring (`#4f46e5`).
- **Error:** Message in Gap Red; form-level errors sit in a `danger-50` washed box
  with `8px` corners.

### Chips (Fit verdicts)
- **Style:** HeroUI `variant="flat"`, colored by status (Match green / Partial amber /
  Gap red), full-round, `12px` label.
- **Layout quirk:** Fixed `w-16`, centered content, so the three verdicts align in a
  tidy left gutter down the requirements list — the fit map reads like a checklist.

### Navigation
- **Style:** A minimal top bar (`max-w-4xl`, `py-5`): logo coin + wordmark left,
  `light` (ghost) buttons right. No background, no border — it floats on the page glow.

### Signature Components
- **The Fit Map:** The hero component. An overall-fit score (large indigo number `/ 100`),
  a one-line summary, then a `match → partial → gap` sorted list of requirement rows,
  each a bordered shadow-none card pairing a fixed-width verdict chip with the JD
  requirement and its résumé evidence (or gap note). This is where the product's value
  is visible; give it primacy in any bundle layout.
- **The Learning-Plan Coin:** Numbered ordered steps, each led by a `24px` full-round
  `indigo-100 / indigo-700` coin bearing its index — sequence made tactile.
- **The Indigo Eyebrow:** A `12px` uppercase indigo micro-label ("Tailored for") sitting
  directly above the role title — the one place the tracked label goes indigo instead of gray.

## Do's and Don'ts

### Do:
- **Do** introduce every section with the uppercase, wide-tracked 12px Faint label (The
  Tracked-Label Rule).
- **Do** reach for a hairline `#f3f4f6` border before a shadow; give nested surfaces
  border only (The Hairline-First Rule).
- **Do** keep indigo as the sole brand accent and let gray weight carry hierarchy (The
  One-Accent Rule).
- **Do** trail forward/primary actions with the **→** motif, and swap button labels to a
  present-tense gerund while loading.
- **Do** keep the single centered column and the one overhead indigo glow; add breathing
  room on the `32px` section rhythm.
- **Do** set raw JD input in monospace; keep everything else in the system sans.

### Don't:
- **Don't** use green, amber, or red for anything but a fit verdict or a system error
  (The Evidence-Only Color Rule).
- **Don't** stack shadows or box every section — flat, bordered surfaces are the identity.
- **Don't** introduce a web font or a second decorative accent color; the neutrality is intentional.
- **Don't** replace a tracked micro-label with a bold sentence-case heading.
- **Don't** widen the app past its centered reading column into a full-bleed dashboard grid.
