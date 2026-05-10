import { Inbox } from "lucide-react";

/**
 * Friendly empty state for pages/sections with no data yet.
 * Pass a Lucide icon component, headline, description, and optional CTA.
 */
function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-ink-200 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-900/40 px-6 py-10 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-ink-800 ring-1 ring-ink-200 dark:ring-ink-700 text-ink-500 dark:text-ink-400">
        <Icon className="h-5 w-5" />
      </div>
      {title && (
        <h3 className="mt-4 text-sm font-semibold text-ink-900 dark:text-ink-100">
          {title}
        </h3>
      )}
      {description && (
        <p className="mt-1 max-w-md text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
