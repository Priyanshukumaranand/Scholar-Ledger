import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";
import useFocusTrap from "../../utils/useFocusTrap";

function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
}) {
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, busy]);

  if (!open) return null;

  const accent =
    tone === "danger"
      ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
      : tone === "warning"
      ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
      : "bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
        onClick={() => !busy && onCancel()}
      />
      <div
        ref={trapRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-ink-200 bg-white p-6 shadow-elevated dark:border-ink-800 dark:bg-ink-900 animate-slide-down focus:outline-none"
      >
        <button
          onClick={onCancel}
          disabled={busy}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100 disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${accent}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-title"
              className="text-base font-semibold text-ink-900 dark:text-ink-100"
            >
              {title}
            </h3>
            {message && (
              <div className="mt-1.5 text-sm text-ink-600 dark:text-ink-400">
                {message}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
