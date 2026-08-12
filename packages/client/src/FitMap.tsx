import { Chip } from "@heroui/react";
import type { FitAnalysis, FitRequirement } from "@jdlearn/shared";

const FIT_STATUS: Record<
  FitRequirement["status"],
  { label: string; color: "success" | "warning" | "danger" }
> = {
  match: { label: "Match", color: "success" },
  partial: { label: "Partial", color: "warning" },
  gap: { label: "Gap", color: "danger" },
};

// Strongest fit first: match → partial → gap.
const FIT_ORDER: Record<FitRequirement["status"], number> = { match: 0, partial: 1, gap: 2 };

/**
 * The fit map — JD requirements ↔ résumé evidence, scored and sorted. Rendered
 * identically for a real bundle (BundleView) and the landing's sample (Home), so the
 * demo can never drift from the actual result. `isExample` renders a visible badge that
 * marks a sample; `subtitle` names the role beneath the label.
 */
export function FitMap({
  fit,
  subtitle,
  isExample = false,
  headingLevel = 3,
}: {
  fit: FitAnalysis;
  subtitle?: string;
  /** Renders a visible "Example" badge so a sample can't be mistaken for a real result. */
  isExample?: boolean;
  /** h3 inside a bundle (under the role h2); h2 when the fit map is a top-level card (landing). */
  headingLevel?: 2 | 3;
}) {
  const Label = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Fit for this role
            </Label>
            {isExample && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                Example
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-indigo-600">{fit.overallFit}</span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>
      </div>
      {fit.summary && <p className="text-sm text-gray-600">{fit.summary}</p>}
      <ul className="space-y-3">
        {[...fit.requirements]
          .sort((a, b) => FIT_ORDER[a.status] - FIT_ORDER[b.status])
          .map((req, i) => {
            const s = FIT_STATUS[req.status];
            return (
              <li key={i} className="flex flex-col gap-2 rounded-xl border border-gray-100 p-4 sm:flex-row sm:gap-3">
                <Chip
                  size="sm"
                  variant="flat"
                  color={s.color}
                  classNames={{
                    base: "mt-0.5 w-16 max-w-none shrink-0 justify-center",
                    content: "w-full px-0 text-center",
                  }}
                >
                  {s.label}
                </Chip>
                <div>
                  <p className="text-sm font-medium text-gray-900">{req.text}</p>
                  {req.evidence && <p className="text-sm text-gray-600">{req.evidence}</p>}
                  {req.gapNote && <p className="text-sm text-gray-500">{req.gapNote}</p>}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
