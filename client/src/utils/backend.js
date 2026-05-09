const RAW_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const BACKEND_URL = RAW_BACKEND_URL || "http://localhost:4000";

export const backendUrl = (path) => `${BACKEND_URL}${path}`;

export const isBackendConfigured = Boolean(RAW_BACKEND_URL);

export const apiFetch = async (path, options = {}) => {
  const res = await fetch(backendUrl(path), {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {}),
    },
  });
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
