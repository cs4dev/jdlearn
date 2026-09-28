---
name: jdlearn
description: Turn a job post into proof — a fit map, cover letter, and learning plan from your real résumé.
colors:
  sign-yellow: "#ffcc00"
  sign-yellow-press: "#f0bd00"
  sign-black: "#0b0b0b"
  panel-frame: "#1a1a1a"
  concourse: "#efefec"
  surface-gray: "#e6e6e6"
  surface: "#ffffff"
  ink: "#0b0b0b"
  ink-soft: "#2b2b2b"
  muted: "#555555"
  on-yellow-muted: "#4a3b00"
  rule: "#c9c9c4"
  flap-text: "#ffcc00"
  flap-dim: "#8a8a84"
  stop-red: "#c8102e"
  stop-red-on-dark: "#ff6b7d"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  gate-number:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(3.5rem, 9vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  small:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  flap:
    fontFamily: "Atkinson Hyperlegible Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.12em"
rounded:
  sm: "3px"
  md: "6px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  sign-band:
    backgroundColor: "{colors.sign-yellow}"
    textColor: "{colors.sign-black}"
    padding: "16px 24px"
  button-primary:
    backgroundColor: "{colors.sign-black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "40px"
  pictogram:
    backgroundColor: "{colors.sign-black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    size: "32px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "24px"
  flap-board:
    backgroundColor: "{colors.sign-black}"
    textColor: "{colors.flap-text}"
    typography: "{typography.flap}"
    rounded: "{rounded.md}"
---

# Design System: jdlearn

## Overview

**Creative North Star: "Terminal Wayfinding"**

A job search is a connection with a clock on it. jdlearn is built like an international
airport sign system: saturated yellow sign panels, black humanist type, white pictograms
on black inset squares, and numbers at monumental scale. Each screen answers the two
questions a traveller asks at a junction: *where do I stand* and *what is next*. The fit
score is the gate number; each JD requirement is a decision point; the learning plan is
the route to the gate; past applications are the departures board.

This is an **Operate** surface for tired people. The sign system exists precisely so a
fatigued stranger reads the right answer in one glance, so legibility is the identity:
high contrast, sentence case, one message per line, no decoration. Yellow is loud by
nature, so it is rationed: it marks wayfinding only (the top band, the fit sign, the
route's destination, the active drop target) and everything you read at length sits on
white panels over a pale concourse gray.

**Key Characteristics:**
- Full-bleed yellow sign band on every page; concourse-gray floor; white reading panels.
- Black inset pictogram squares carry verdicts, arrows, and actions — never color alone.
- Atkinson Hyperlegible throughout; monumental gate-number numerals for the fit score.
- Past applications as a black split-flap departures board in yellow mono caps.
- Sentence case everywhere except the flap board. No tracked-uppercase eyebrows.

## Colors

### Primary
- **Sign Yellow** (`#ffcc00`): wayfinding only — the header band, the fit sign, the
  capstone flag at the end of the plan route, the active drop zone, hover on sign-band
  links. Never a hero or page-section fill. Never a button fill in reading areas, never decoration.
- **Sign Black** (`#0b0b0b`): all type, primary buttons, pictogram insets, frames, focus
  rings, the flap board ground.

### Neutral
- **Concourse** (`#efefec`): the page floor under the band.
- **Surface** (`#ffffff`): every reading panel (letter, plan, forms, rows).
- **Surface Gray** (`#e6e6e6`): recessed fields, skeleton fill, hover on white rows.
- **Rule** (`#c9c9c4`): 1px panel borders and dividers on white/concourse.
- **Ink Soft** (`#2b2b2b`) / **Muted** (`#555555`): body and supporting text on white.
- **On-Yellow Muted** (`#4a3b00`): supporting text on yellow (tinted from the hue, ≥7:1).
- **Flap Text** (`#ffcc00`) / **Flap Dim** (`#8a8a84`): flap board type on black.

### Tertiary
- **Stop Red** (`#c8102e`): errors and destructive actions only (the "no entry" sign).
  **Stop Red on Dark** (`#ff6b7d`) is its flap-board form (FAILED, Permanently delete) —
  `#c8102e` fails contrast on black.

### Named Rules
**The Wayfinding-Only Rule.** Yellow means "this tells you where you are or where to go
next." If a yellow surface doesn't orient, it's decoration — make it white.
**The Pictogram Rule.** Verdicts and states are carried by pictogram shape and a word
(✓ Match, ◐ Partial, ✕ Gap); color never carries meaning on its own.

## Typography

**Font:** Atkinson Hyperlegible Next (Braille Institute's legibility-engineered humanist
sans), weights 400–800. **Mono:** Atkinson Hyperlegible Mono — the flap board, the raw JD
paste field, and nothing else.

### Hierarchy
- **Display** (800, clamp 2.75→4.5rem, lh 0.98, -0.03em): landing headline only.
- **Gate number** (800, clamp 3.5→5.5rem, -0.04em): the fit score. Monumental on purpose.
- **Headline** (800, 1.875rem): page H1 and the role title.
- **Title** (700, 1.25rem): section headings, sentence case.
- **Body** (400, 1rem, lh 1.55): default; cover letter capped at ~68ch.
- **Small** (400, 0.875rem): evidence, timestamps, hints.
- **Flap** (mono 600, 0.875rem, uppercase, 0.12em): departures board only.

### Named Rules
**The Sentence-Case Rule.** Signs speak in sentence case, one message per line. Uppercase
tracking lives only on the flap board, where it is the board's native grammar.

## Layout

A single working column (`max-w-3xl`, 768px) under a full-bleed sign band whose content
aligns to a wider `max-w-6xl` rail. Gutters 16px mobile / 24px desktop. Sections stack on
40px; panel interiors 24px; related lines 8–12px.

The landing is one screen on desktop (no scroll at ≥768px tall), on concourse gray under
the yellow band — never a yellow hero (too loud). Row 1: the headline with a black
"proof." plate, and the intro paragraph bottom-aligned in the right column. Row 2, on the
same 1.25fr / 1fr grid: the example fit map (rows stretched) and the black-framed sign-up
panel, sharing top and bottom edges. The example must stay realistic for its role (a
frontend role's gap is a frontend skill). Mobile stacks headline → example → sign-up.

## Elevation & Depth

Flat, like printed polycarbonate. Surfaces separate by value (yellow / white / concourse /
black) and 1px rules, never by shadow. The only depth is the 2px black frame on the fit
sign and focused/active controls — a sign's aluminium frame.

## Shapes

Near-square: 3px on buttons, pictograms and inputs; 6px on panels and the board. Pictogram
insets are true squares. No pills, no circles except inside a pictogram glyph.

## Components

### Sign band (header)
Full-bleed yellow, 1px black bottom rule. Logo pictogram + wordmark left; text links
right (black, 600). Active route = black fill, yellow text.

### Buttons
- **Primary:** black fill, white 600 text, 3px radius, 44px tall; forward actions lead
  with an inset arrow square (white outline). Hover dims slightly (HeroUI opacity); loading
  swaps the label to a gerund ("Generating…").
- **Secondary:** white, 2px black border, black text; trailing chevron for navigation.
- **Quiet:** text-only black, underline on hover — nav, Cancel.
- **Danger:** Stop Red text or fill, only for delete/purge.

### Fit sign (signature)
Yellow panel with 2px black frame. Left: "Fit for this role" + gate-number score + "/ 100". Right: role,
verdict counts, summary. Below: requirement rows on white — a black pictogram square
(✓ / ◐) or a dashed-outline square (✕ for gaps) + requirement + résumé evidence prefixed
"From your résumé". Gap rows use a dashed rule: a closed route, shown as closed.

### Section heads
A small black pictogram square + title, over a 2px ink rule (Cover letter, Learning plan).

### Plan route
Numbered black squares joined by a 2px vertical route line; the capstone project is a
black-framed white panel at the end of the line, whose last stop is a yellow flag square labelled "Capstone project" (the only yellow);
the panel hangs below the flag at full column width.

### Departures board
Black panel, mono flap cells: date · role · fit · status in caps, the role in sentence
case for legibility. Fit folds under the time on phones. Columns: (READY / GENERATING /
FAILED / DELETED). A status change flips the cell (rotateX, 360ms, reduced-motion → instant).

### Inputs
White, 2px `#c9c9c4` border → black on focus, 3px radius, label above in 600.

## Do's and Don'ts

### Do:
- **Do** answer "where do I stand / what's next" first on every screen.
- **Do** pair every verdict or state with a pictogram and a word.
- **Do** keep long reading on white panels at ≤68ch.
- **Do** use the flap board for lists of applications, and only there.

### Don't:
- **Don't** use yellow for anything that doesn't orient (Wayfinding-Only Rule).
- **Don't** reintroduce indigo, violet, gradients, glows, or soft shadows.
- **Don't** set tracked uppercase eyebrows over sections.
- **Don't** use mono for anything but the flap board and the raw JD field.
- **Don't** round panels past 6px or turn chips into pills.
