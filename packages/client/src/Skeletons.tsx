// Placeholders drawn in the world's own shapes: a dark departures board, the yellow-
// framed fit sign, verdict rows. Plain pulsing blocks (reduced-motion → static).
const bar = "rounded-[3px] motion-safe:animate-pulse";

/** Placeholder rows matching the departures board (past/archived applications). */
export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-md bg-ink" aria-hidden="true">
      <div className="border-b border-frame px-4 py-3.5">
        <div className={`h-3 w-32 bg-frame ${bar}`} />
      </div>
      <ul className="divide-y divide-frame">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex gap-4 px-4 py-4">
            <div className={`h-3.5 w-24 bg-frame ${bar}`} />
            <div className={`h-3.5 flex-1 bg-frame ${bar}`} />
            <div className={`h-3.5 w-16 bg-frame ${bar}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bundle-shaped placeholder during the ~60s generation, so the wait previews the
 *  shape of the incoming fit map (role title → score sign → verdict rows) rather than a
 *  bare spinner. Mirrors BundleView's structure. */
export function BundleSkeleton() {
  return (
    // Decorative placeholder; the accompanying aria-live status announces progress.
    <div className="space-y-10" aria-hidden="true">
      <div className="space-y-2">
        <div className={`h-3.5 w-24 bg-surface-gray ${bar}`} />
        <div className={`h-8 w-2/3 bg-surface-gray ${bar}`} />
      </div>
      <div className="space-y-2">
        <div className="flex gap-6 rounded-md bg-sign-yellow/40 p-6 ring-2 ring-ink/20">
          <div className={`h-20 w-28 bg-sign-yellow/70 ${bar}`} />
          <div className="flex-1 space-y-3 pt-2">
            <div className={`h-5 w-1/2 bg-sign-yellow/70 ${bar}`} />
            <div className={`h-3.5 w-3/4 bg-sign-yellow/70 ${bar}`} />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-md border border-rule bg-white p-4">
            <div className={`h-6 w-20 shrink-0 bg-surface-gray ${bar}`} />
            <div className="w-full space-y-2">
              <div className={`h-3.5 w-3/4 bg-surface-gray ${bar}`} />
              <div className={`h-3 w-1/2 bg-surface-gray ${bar}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Page-level skeleton while the session resolves. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6" aria-hidden="true">
      <div className={`h-9 w-1/2 bg-surface-gray ${bar}`} />
      <div className={`h-4 w-2/3 bg-surface-gray ${bar}`} />
      <RowsSkeleton />
    </div>
  );
}
