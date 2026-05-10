import { useEffect, useRef, useState } from "react";

const PREFIX = "scholar-ledger:draft:";

/**
 * Persists form state to localStorage so refreshes don't lose work.
 * Returns [state, setState, clearDraft]. Pass `enabled: false` to opt out.
 */
export default function useFormDraft(key, initialValue, options = {}) {
  const { enabled = true, debounceMs = 300 } = options;
  const storageKey = PREFIX + key;
  const [state, setState] = useState(() => {
    if (!enabled) return initialValue;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...initialValue, ...parsed };
      }
    } catch {
      // ignore — corrupt JSON
    }
    return initialValue;
  });

  const timer = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // quota exceeded or disabled — silently ignore
      }
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, storageKey, enabled, debounceMs]);

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  return [state, setState, clearDraft];
}
