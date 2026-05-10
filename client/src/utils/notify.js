import { apiFetch } from "./backend";
import { resolveStudent, resolveIssuer } from "./identity";

const TOKEN_KEY = "scholar-ledger:notify-token";
const ENABLED_KEY = "scholar-ledger:notify-enabled";

export const getNotifyToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

export const setNotifyToken = (token) => {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

export const getNotifyEnabled = () => {
  try {
    return window.localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
};

export const setNotifyEnabled = (enabled) => {
  try {
    window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
};

const verifyUrlFor = (student, index) =>
  `${window.location.origin}/verify/${student}/${index}`;

/**
 * Best-effort email notification. Silent no-op if disabled, no token, or
 * the student has no email on their profile. Never throws — caller fires
 * and forgets after a successful on-chain action.
 */
export async function notifyCredentialIssued({ student, index, title, issuerAddress }) {
  try {
    if (!getNotifyEnabled()) return { skipped: "disabled" };
    const token = getNotifyToken();
    if (!token) return { skipped: "no-token" };

    const [studentProfile, issuerProfile] = await Promise.all([
      resolveStudent(student),
      issuerAddress ? resolveIssuer(issuerAddress) : Promise.resolve(null),
    ]);
    const email = studentProfile?.email;
    if (!email) return { skipped: "no-email" };

    await apiFetch("/api/v1/notify/credential-issued", {
      method: "POST",
      headers: { "x-api-token": token },
      body: JSON.stringify({
        to: email,
        studentName: studentProfile?.name || "",
        title,
        issuerName: issuerProfile?.name || issuerProfile?.shortName || "",
        verifyUrl: verifyUrlFor(student, index),
      }),
    });
    return { ok: true };
  } catch (err) {
    return { error: err?.message || "send failed" };
  }
}

export async function notifyCredentialRevoked({ student, title }) {
  try {
    if (!getNotifyEnabled()) return { skipped: "disabled" };
    const token = getNotifyToken();
    if (!token) return { skipped: "no-token" };

    const studentProfile = await resolveStudent(student);
    const email = studentProfile?.email;
    if (!email) return { skipped: "no-email" };

    await apiFetch("/api/v1/notify/credential-revoked", {
      method: "POST",
      headers: { "x-api-token": token },
      body: JSON.stringify({
        to: email,
        studentName: studentProfile?.name || "",
        title,
      }),
    });
    return { ok: true };
  } catch (err) {
    return { error: err?.message || "send failed" };
  }
}
