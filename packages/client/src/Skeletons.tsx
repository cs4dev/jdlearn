import { Card, CardBody, Skeleton } from "@heroui/react";

/** Placeholder rows matching the past/archived application list. */
export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="border border-gray-100" shadow="none">
      <ul className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="space-y-2 px-4 py-3">
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-1/4 rounded-md" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Bundle-shaped placeholder during the ~60s generation, so the wait previews the
 *  shape of the incoming fit map (role title → score → verdict rows) rather than a
 *  bare spinner. Mirrors BundleView's structure. */
export function BundleSkeleton() {
  return (
    // Decorative placeholder; the accompanying aria-live status announces progress.
    <Card className="border border-gray-100" shadow="sm" aria-hidden="true">
      <CardBody className="gap-8 p-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-7 w-2/3 rounded-lg" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
          <Skeleton className="h-3 w-full rounded-md" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-gray-100 p-4">
              <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-3.5 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

/** Page-level skeleton while the session resolves. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Skeleton className="h-9 w-1/2 rounded-lg" />
      <Skeleton className="h-4 w-2/3 rounded-md" />
      <RowsSkeleton />
    </div>
  );
}
