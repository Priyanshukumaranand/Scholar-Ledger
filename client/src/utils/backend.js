const RAW_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const BACKEND_URL = RAW_BACKEND_URL || "http://localhost:4000";

export const backendUrl = (path) => `${BACKEND_URL}${path}`;

export const isBackendConfigured = Boolean(RAW_BACKEND_URL);

const DEFAULT_TIMEOUT_MS = 20000;

export const apiFetch = async (path, options = {}) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let res;
  try {
    res = await fetch(backendUrl(path), {
      ...rest,
      signal: controller.signal,
      headers: {
        ...(rest.body && !(rest.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(rest.headers || {}),
      },
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(
        `Backend did not respond within ${Math.round(timeoutMs / 1000)}s. Is the server running?`
      );
    }
    throw new Error(
      `Cannot reach backend at ${BACKEND_URL}. Make sure the API server is running.`
    );
  } finally {
    clearTimeout(timer);
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg = body?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
};
