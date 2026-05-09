const tones = {
  neutral:
    "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300",
  brand:
    "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200 border border-brand-100/50 dark:border-brand-800/50",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100/60 dark:border-emerald-800/40",
  danger:
    "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-100/60 dark:border-red-800/40",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100/60 dark:border-amber-800/40",
};

function Badge({ tone = "neutral", className = "", children, ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
