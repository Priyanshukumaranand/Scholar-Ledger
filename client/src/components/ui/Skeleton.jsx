/**
 * Shape-matching skeleton placeholder. Compose with `className` to size/shape.
 */
export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded bg-ink-200/70 dark:bg-ink-800 ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`rounded-xl border border-ink-200 dark:border-ink-800 p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-4 space-y-2.5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

export default Skeleton;
