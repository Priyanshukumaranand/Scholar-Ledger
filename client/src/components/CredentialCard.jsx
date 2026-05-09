import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  XCircle,
  Calendar,
} from "lucide-react";
import { generateCredentialPDF } from "../utils/pdfGenerator";
import { ipfsUrl } from "../utils/identity";
import { useToast } from "../context/ToastContext";
import IssuerBadge from "./IssuerBadge";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

function CredentialCard({ credential, studentAddress, canRevoke, onRevoke }) {
  const { pushToast } = useToast();
  const [copied, setCopied] = useState("");
  const [generating, setGenerating] = useState(false);

  const verifyUrl = `${window.location.origin}/verify/${studentAddress}/${credential.index}`;
  const ipfsHref = credential.cid ? ipfsUrl(credential.cid) : null;

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      // ignore
    }
  };

  const downloadPDF = async () => {
    setGenerating(true);
    try {
      await generateCredentialPDF({
        studentAddress,
        cidHash: credential.cidHash,
        cid: credential.cid,
        title: credential.title,
        issuedOn: credential.issuedOn,
        revoked: credential.revoked,
        issuer: credential.issuer,
        verifyUrl,
        ipfsUrl: ipfsHref,
      });
    } catch (err) {
      pushToast({
        tone: "danger",
        title: "PDF generation failed",
        message: err.message || "Unknown error",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:shadow-elevated ${
        credential.revoked
          ? "border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20"
          : "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
      }`}
    >
      {/* Subtle accent stripe on the left */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          credential.revoked ? "bg-red-400" : "bg-emerald-400"
        }`}
      />

      <div className="flex flex-wrap gap-5 pl-2">
        <div className="flex-1 min-w-[260px]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">
              {credential.title}
            </h3>
            <Badge tone={credential.revoked ? "danger" : "success"}>
              {credential.revoked ? "Revoked" : "Active"}
            </Badge>
          </div>

          <div className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-ink-600 dark:text-ink-400">
              <Calendar className="h-3.5 w-3.5 text-ink-400" />
              <span className="text-xs">Issued</span>
              <span className="text-ink-900 dark:text-ink-100 font-medium">
                {credential.issuedOn}
              </span>
            </div>
            <div className="pt-1">
              <IssuerBadge address={credential.issuer} />
            </div>
            {credential.cid && (
              <div className="flex items-start gap-2 text-xs pt-1">
                <span className="text-ink-500 dark:text-ink-500 mt-0.5">IPFS</span>
                <a
                  href={ipfsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 break-all font-mono text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {credential.cid.slice(0, 24)}…
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={downloadPDF} disabled={generating}>
              <Download className="h-3.5 w-3.5" />
              {generating ? "Generating…" : "Download PDF"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => copy(verifyUrl, "verify")}>
              {copied === "verify" ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </>
              )}
            </Button>
            {canRevoke && !credential.revoked && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => onRevoke(studentAddress, credential.index)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Revoke
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="rounded-lg bg-white p-2 ring-1 ring-ink-200 dark:ring-ink-700">
            <QRCodeSVG value={verifyUrl} size={104} level="M" />
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-wider text-ink-500 dark:text-ink-400">
            Scan to verify
          </p>
        </div>
      </div>
    </div>
  );
}

export default CredentialCard;
