import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext({ pushToast: () => {} });

const TONE_STYLES = {
  success: {
    icon: CheckCircle2,
    accent: "border-emerald-200 dark:border-emerald-800/60",
    bar: "bg-emerald-500",
    iconClass: "text-emerald-500",
  },
  danger: {
    icon: AlertCircle,
    accent: "border-red-200 dark:border-red-800/60",
    bar: "bg-red-500",
    iconClass: "text-red-500",
  },
  info: {
    icon: Info,
    accent: "border-brand-200 dark:border-brand-800/60",
    bar: "bg-brand-500",
    iconClass: "text-brand-500",
  },
};

let nextId = 1;
const MAX_VISIBLE = 3;
const DEDUPE_WINDOW_MS = 2000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const recentSignatures = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    ({ tone = "info", title, message, duration = 5000 } = {}) => {
      const signature = `${tone}|${title || ""}|${message || ""}`;
      const now = Date.now();
      const lastSeen = recentSignatures.current.get(signature) || 0;
      if (now - lastSeen < DEDUPE_WINDOW_MS) {
        return null;
      }
      recentSignatures.current.set(signature, now);
      // garbage-collect signature map opportunistically
      if (recentSignatures.current.size > 50) {
        for (const [k, v] of recentSignatures.current) {
          if (now - v > DEDUPE_WINDOW_MS) recentSignatures.current.delete(k);
        }
      }

      const id = nextId++;
      setToasts((ts) => {
        const next = [...ts, { id, tone, title, message }];
        if (next.length <= MAX_VISIBLE) return next;
        // evict oldest, cancel its dismiss timer
        const evicted = next.slice(0, next.length - MAX_VISIBLE);
        evicted.forEach((t) => {
          const h = timers.current.get(t.id);
          if (h) {
            clearTimeout(h);
            timers.current.delete(t.id);
          }
        });
        return next.slice(-MAX_VISIBLE);
      });

      if (duration > 0) {
        const handle = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((h) => clearTimeout(h));
      timers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const config = TONE_STYLES[t.tone] || TONE_STYLES.info;
          const Icon = config.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto overflow-hidden rounded-lg border bg-white shadow-elevated dark:bg-ink-900 ${config.accent} animate-fade-in`}
            >
              <div className="flex gap-3 p-4">
                <div className={`flex-shrink-0 ${config.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {t.title && (
                    <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                      {t.title}
                    </p>
                  )}
                  {t.message && (
                    <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-300">
                      {t.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="flex-shrink-0 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className={`h-0.5 ${config.bar}`} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
