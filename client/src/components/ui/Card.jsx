function Card({
  className = "",
  children,
  padded = true,
  hoverable = false,
  ...props
}) {
  return (
    <div
      className={`rounded-xl border border-ink-200 bg-white shadow-card transition-shadow dark:border-ink-800 dark:bg-ink-900 ${
        hoverable ? "hover:shadow-elevated" : ""
      } ${padded ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export default Card;
