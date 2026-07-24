import { Card, Skeleton } from "@heroui/react";

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
