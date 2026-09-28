import type { FitAnalysis, FitRequirement } from "@jdlearn/shared";
import { Check, Cross, Half, Picto } from "./sign";

// Each verdict is a pictogram + a word — never color alone (DESIGN.md Pictogram Rule).
// Gaps get the dashed "closed route" square and row.
const FIT_STATUS: Record<
  FitRequirement["status"],
  { label: string; picto: React.ReactNode }
> = {
  match: { label: "Match", picto: <Picto size="sm"><Check className="h-3.5 w-3.5" /></Picto> },
  partial: { label: "Partial", picto: <Picto size="sm"><Half className="h-3.5 w-3.5" /></Picto> },
  gap: { label: "Gap", picto: <Picto size="sm" tone="open"><Cross className="h-3 w-3" /></Picto> },
};

// Strongest fit first: match → partial → gap.
const FIT_ORDER: Record<FitRequirement["status"], number> = { match: 0, partial: 1, gap: 2 };

/**
 * The fit map — JD requirements ↔ résumé evidence, scored and sorted. Rendered
 * identically for a real bundle (BundleView) and the landing's sample (Home), so the
 * demo can never drift from the actual result. `isExample` renders a visible badge that
 * marks a sample; `subtitle` names the role on the sign.
 */
export function FitMap({
  fit,
  subtitle,
  isExample = false,
  headingLevel = 3,
  fill = false,
}: {
  fit: FitAnalysis;
  subtitle?: string;
  /** Renders a visible "Example" badge so a sample can't be mistaken for a real result. */
  isExample?: boolean;
  /** h3 inside a bundle (under the role h2); h2 when the fit map is a top-level card (landing). */
  headingLevel?: 2 | 3;
  /** Stretch rows to fill a height-matched column (landing, beside the sign-up panel). */
  fill?: boolean;
}) {
  const Label = headingLevel === 2 ? "h2" : "h3";
  const count = (s: FitRequirement["status"]) =>
    fit.requirements.filter((r) => r.status === s).length;
  return (
    <div className="flex h-full flex-col gap-2">
      {/* The fit sign: the score at gate-number scale, the verdict tally beside it. */}
      <div className="grid gap-4 rounded-md border-2 border-ink bg-sign-yellow p-5 sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-base font-bold">Fit for this role</Label>
            {isExample && (
              <span className="rounded-[3px] bg-ink px-1.5 py-0.5 text-xs font-bold text-sign-yellow">
                Example
              </span>
            )}
          </div>
          <p className="mt-1 flex items-baseline gap-1.5 leading-none">
            <span className="text-[clamp(3.5rem,9vw,5.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] tabular-nums">
              {fit.overallFit}
            </span>
            <span className="text-lg font-bold text-on-yellow-muted">/ 100</span>
          </p>
        </div>
        <div className="space-y-2 border-t-2 border-ink pt-4 sm:border-t-0 sm:border-l-2 sm:pl-6 sm:pt-0">
          {subtitle && <p className="text-xl font-bold leading-tight">{subtitle}</p>}
          <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
            {(["match", "partial", "gap"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                {FIT_STATUS[k].picto}
                {count(k)} {k}
              </span>
            ))}
          </p>
          {fit.summary && <p className="text-sm leading-snug text-on-yellow-muted">{fit.summary}</p>}
        </div>
      </div>

      <ul className={fill ? "grid flex-1 auto-rows-fr gap-2" : "space-y-2"}>
        {[...fit.requirements]
          .sort((a, b) => FIT_ORDER[a.status] - FIT_ORDER[b.status])
          .map((req, i) => {
            const s = FIT_STATUS[req.status];
            const gap = req.status === "gap";
            return (
              <li
                key={i}
                className={`flex flex-col gap-2 rounded-md bg-white p-4 sm:flex-row sm:items-center sm:gap-4 ${
                  gap ? "border-2 border-dashed border-ink/50" : "border border-rule"
                }`}
              >
                <span className="flex w-24 shrink-0 items-center gap-2 text-sm font-bold">
                  {s.picto}
                  {s.label}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="font-bold leading-snug">{req.text}</p>
                  {req.evidence && (
                    <p className="text-sm text-muted">
                      <span className="font-bold text-ink-soft">From your résumé: </span>
                      {req.evidence}
                    </p>
                  )}
                  {req.gapNote && <p className="text-sm text-muted">{req.gapNote}</p>}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
