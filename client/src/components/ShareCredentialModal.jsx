import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  X,
  Copy,
  Check,
  Mail,
  Linkedin,
  Download,
  Twitter,
} from "lucide-react";
import Button from "./ui/Button";

function ShareCredentialModal({ open, onClose, verifyUrl, title, issuerName }) {
  const [copied, setCopied] = useState(false);
  const qrWrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const downloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    const slug = (title || "credential")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    a.download = `scholar-ledger-${slug}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const subject = `Verify my credential: ${title || "Scholar Ledger credential"}`;
  const body = [
    `You can verify my credential here:`,
    verifyUrl,
    "",
    issuerName ? `Issued by ${issuerName}.` : null,
    "Verification is on-chain via Scholar Ledger.",
  ]
    .filter(Boolean)
    .join("\n");

  const mailtoHref = `mailto:?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    verifyUrl
  )}`;
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${title || "My credential"} — verify on-chain:`
  )}&url=${encodeURIComponent(verifyUrl)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share credential"
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-ink-200 dark:border-ink-800">
          <div>
            <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">
              Share credential
            </h3>
            {title && (
              <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400 truncate">
                {title}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-800/30 p-3">
            <div ref={qrWrapRef} className="flex-shrink-0 rounded-md bg-white p-1.5 ring-1 ring-ink-200 dark:ring-ink-700">
              <QRCodeCanvas value={verifyUrl} size={88} level="M" includeMargin={false} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono break-all text-ink-700 dark:text-ink-300 line-clamp-3">
                {verifyUrl}
              </p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={copyLink}>
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy link
                    </>
                  )}
                </Button>
                <Button size="sm" variant="secondary" onClick={downloadQr}>
                  <Download className="h-3.5 w-3.5" />
                  QR PNG
                </Button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-2">
              Send to
            </p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={mailtoHref}
                className="flex flex-col items-center gap-1 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-3 text-xs text-ink-700 dark:text-ink-300 hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-brand-950/30 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
              <a
                href={linkedinHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-3 text-xs text-ink-700 dark:text-ink-300 hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-brand-950/30 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
              <a
                href={twitterHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-3 text-xs text-ink-700 dark:text-ink-300 hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-brand-950/30 transition-colors"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </a>
            </div>
          </div>

          <p className="text-[11px] text-ink-500 dark:text-ink-400">
            Anyone with this link can verify the credential on-chain. They don't need a wallet or an account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ShareCredentialModal;
