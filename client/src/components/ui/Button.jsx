import { forwardRef } from "react";

const variants = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500/40 disabled:bg-brand-300 disabled:hover:bg-brand-300 dark:disabled:bg-brand-800/50 shadow-sm",
  secondary:
    "bg-white text-ink-900 border border-ink-200 hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100 focus-visible:ring-ink-400/30 disabled:opacity-50 dark:bg-ink-900 dark:text-ink-100 dark:border-ink-800 dark:hover:bg-ink-800 dark:hover:border-ink-700 shadow-soft",
  ghost:
    "bg-transparent text-ink-700 hover:bg-ink-100 active:bg-ink-200 dark:text-ink-300 dark:hover:bg-ink-800 dark:active:bg-ink-700",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500/40 disabled:bg-red-300 shadow-sm",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500/40 disabled:bg-emerald-300 shadow-sm",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  xl: "h-12 px-6 text-base",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    children,
    ...props
  },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed select-none whitespace-nowrap";
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
