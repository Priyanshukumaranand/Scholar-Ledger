const config = require("../config");

let resendClient = null;
const getResend = () => {
  if (!config.email.enabled) return null;
  if (!resendClient) {
    const { Resend } = require("resend");
    resendClient = new Resend(config.email.apiKey);
  }
  return resendClient;
};

const escapeHtml = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isSafeHttpUrl = (url) => {
  try {
    const u = new URL(String(url));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const requireApiToken = (request, reply) => {
  const expected = process.env.NOTIFY_API_TOKEN;
  if (!expected) {
    reply.code(503).send({ error: "Notify endpoint not enabled on server" });
    return false;
  }
  const provided =
    request.headers["x-api-token"] ||
    (request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (provided !== expected) {
    reply.code(401).send({ error: "Unauthorized" });
    return false;
  }
  return true;
};

/**
 * Email notifications. Protected by NOTIFY_API_TOKEN — frontend admin must
 * include it in `x-api-token`. All user-supplied strings are HTML-escaped
 * and verifyUrl is restricted to http(s).
 */
module.exports = async function (fastify) {
  fastify.post("/notify/credential-issued", async (request, reply) => {
    if (!requireApiToken(request, reply)) return;
    const resend = getResend();
    if (!resend) {
      return reply.code(503).send({ error: "Email service not configured" });
    }
    const { to, studentName, title, issuerName, verifyUrl } = request.body || {};
    if (!isValidEmail(to) || !title || !verifyUrl) {
      return reply
        .code(400)
        .send({ error: "Required: valid `to`, `title`, `verifyUrl`" });
    }
    if (!isSafeHttpUrl(verifyUrl)) {
      return reply.code(400).send({ error: "verifyUrl must be http(s)" });
    }

    const safeStudent = escapeHtml(studentName || "there");
    const safeIssuer = escapeHtml(issuerName || "An issuer");
    const safeTitle = escapeHtml(title);
    const safeUrl = escapeHtml(verifyUrl);

    try {
      await resend.emails.send({
        from: config.email.from,
        to,
        subject: `New credential issued: ${title}`.slice(0, 200),
        html: `
          <h2>You have a new credential</h2>
          <p>Hi ${safeStudent},</p>
          <p><strong>${safeIssuer}</strong> has issued you a new credential:</p>
          <p style="font-size:18px;"><strong>${safeTitle}</strong></p>
          <p>
            <a href="${safeUrl}" style="background:#14285a;color:white;padding:10px 18px;text-decoration:none;border-radius:6px;">
              View &amp; Verify
            </a>
          </p>
          <p style="color:#777;font-size:12px;">
            This credential is anchored on a public blockchain and is independently verifiable.
          </p>
        `,
      });
      return { ok: true };
    } catch (err) {
      return reply.code(500).send({ error: err.message || "Send failed" });
    }
  });

  fastify.post("/notify/credential-revoked", async (request, reply) => {
    if (!requireApiToken(request, reply)) return;
    const resend = getResend();
    if (!resend) {
      return reply.code(503).send({ error: "Email service not configured" });
    }
    const { to, studentName, title } = request.body || {};
    if (!isValidEmail(to) || !title) {
      return reply.code(400).send({ error: "Required: valid `to`, `title`" });
    }

    const safeStudent = escapeHtml(studentName || "there");
    const safeTitle = escapeHtml(title);

    try {
      await resend.emails.send({
        from: config.email.from,
        to,
        subject: `Credential revoked: ${title}`.slice(0, 200),
        html: `
          <h2>A credential has been revoked</h2>
          <p>Hi ${safeStudent},</p>
          <p>The following credential issued to your wallet has been revoked by the issuer:</p>
          <p style="font-size:18px;"><strong>${safeTitle}</strong></p>
          <p style="color:#777;font-size:12px;">
            If you believe this is in error, please contact the issuing institution directly.
          </p>
        `,
      });
      return { ok: true };
    } catch (err) {
      return reply.code(500).send({ error: err.message || "Send failed" });
    }
  });
};
