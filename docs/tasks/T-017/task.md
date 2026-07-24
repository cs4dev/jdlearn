# T-017 — gate JD input on having a résumé

**Track:** solo (trivial client-only UX change; gate is the verdict).

## Problem
A signed-in user with no résumé (never built one, never imported) lands on the
generator and can paste a JD straight away — the cover letter then falls back to
generic. The résumé is the whole point (personalized proof), so send them there
first.

## Change
In `Generator.tsx`, query `getResume`. When it resolves to `null` (no résumé yet),
replace the JD textarea card with a CTA card pointing to `/resume`
("Add your résumé first"). Once a résumé exists, the JD input renders as before.
Show a skeleton while the query is pending. Past applications section unchanged.

## Out of scope
- No SPEC change (behavior of generation is unchanged; this only reorders the flow).
- No server change — `getResume` already exists.
