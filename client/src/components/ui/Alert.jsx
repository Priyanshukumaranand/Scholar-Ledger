import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

const config = {
  info: {
    icon: Info,
    cls: "bg-brand-50/70 text-brand-900 border-brand-200/70 dark:bg-brand-950/30 dark:text-brand-100 dark:border-brand-900/60",
    iconCls: "text-brand-500 dark:text-brand-400",
  },
  success: {
    icon: CheckCircle2,
    cls: "bg-emerald-50/70 text-emerald-900 border-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-100 dark:border-emerald-900/60",
    iconCls: "text-emerald-500 dark:text-emerald-400",
  },
  danger: {
    icon: AlertCircle,
    cls: "bg-red-50/70 text-red-900 border-red-200/70 dark:bg-red-950/30 dark:text-red-100 dark:border-red-900/60",
    iconCls: "text-red-500 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    cls: "bg-amber-50/70 text-amber-900 border-amber-200/70 dark:bg-amber-950/30 dark:text-amber-100 dark:border-amber-900/60",
    iconCls: "text-amber-500 dark:text-amber-400",
  },
};

function Alert({ tone = "info", title, children, className = "", icon = true }) {
  const c = config[tone] || config.info;
  const Icon = c.icon;
  return (
    <div
      role="alert"
      className={`rounded-lg border px-4 py-3 text-sm ${c.cls} ${className}`}
    >
      <div className="flex gap-3">
        {icon && (
          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${c.iconCls}`} />
        )}
        <div className="flex-1 min-w-0">
          {title && <div className="mb-1 font-semibold">{title}</div>}
          {children && <div className="leading-relaxed">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export default Alert;
