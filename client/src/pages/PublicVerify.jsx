import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  ArrowRight,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Award,
} from "lucide-react";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { ipfsUrl, shortAddr, resolveIssuer } from "../utils/identity";
import { humanizeError } from "../utils/errors";
import IssuerBadge from "../components/IssuerBadge";
import StudentBadge from "../components/StudentBadge";
import Card from "../components/ui/Card";
import useDocumentTitle from "../utils/useDocumentTitle";
import Badge from "../components/ui/Badge";
import Alert from "../components/ui/Alert";

function CheckRow({ ok, label, detail }) {
  return (
    <li className="flex items-start gap-2.5 py-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink-900 dark:text-ink-100">
          {label}
        </div>
        {detail && (
          <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            {detail}
          </div>
        )}
      </div>
    </li>
  );
}

function PublicVerify() {
  const { address, index } = useParams();
  useDocumentTitle("Verify Credential");
  const [credential, setCredential] = useState(null);
  const [issuer, setIssuer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewKind, setPreviewKind] = useState(null); // "image" | "pdf" | "other" | null
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const contract = getReadOnlyContract("scholarLedger");
        const total = Number(await contract.getCredentialCount(address));
        const idx = Number(index);
        if (Number.isNaN(idx) || idx < 0 || idx >= total) {
          if (alive) setError("Credential not found for this student.");
          return;
        }
        const cred = await contract.getCredential(address, idx);
        if (!alive) return;
        const credObj = {
          index: idx,
          cidHash: cred[0],
          cid: cred[1],
          title: cred[2],
          issuedOn: new Date(Number(cred[3]) * 1000).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          issuedOnRaw: Number(cred[3]),
          revoked: cred[4],
          issuer: cred[5],
        };
        setCredential(credObj);

        const iss = await resolveIssuer(cred[5]);
        if (alive) setIssuer(iss);
      } catch (err) {
        if (alive) setError(humanizeError(err, "Could not reach the network."));
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [address, index]);

  // Sniff the IPFS document content-type to pick a preview renderer.
  useEffect(() => {
    if (!credential?.cid) return;
    let alive = true;
    const url = ipfsUrl(credential.cid);
    fetch(url, { method: "HEAD" })
      .then((res) => {
        if (!alive) return;
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.startsWith("image/")) setPreviewKind("image");
        else if (ct.includes("pdf")) setPreviewKind("pdf");
        else setPreviewKind("other");
      })
      .catch(() => {
        if (alive) setPreviewKind("other");
      });
    return () => {
      alive = false;
    };
  }, [credential?.cid]);

  const verifyUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-brand-500" />
        <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">
          Verifying credential on-chain…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <div className="text-center py-6">
            <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
              Verification Failed
            </h2>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
              {error}
            </p>
            <p className="mt-5 text-xs text-ink-400 font-mono break-all">
              {address}
              <br />#{index}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const isValid = !credential.revoked;
  const issuerKnown = !!issuer?.exists;
  const issuerAccredited = !!issuer?.accredited;

  return (
    <div className="max-w-4xl mx-auto space-y-5 print:max-w-none print:space-y-3">
      {/* Hero status */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 p-7 sm:p-9 ${
          isValid
            ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-800/60 dark:from-emerald-950/30 dark:to-ink-900"
            : "border-red-300 bg-gradient-to-br from-red-50 to-white dark:border-red-800/60 dark:from-red-950/30 dark:to-ink-900"
        }`}
      >
        <div className="flex items-start gap-5 flex-wrap">
          <div
            className={`h-20 w-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isValid
                ? "bg-emerald-100 dark:bg-emerald-900/40"
                : "bg-red-100 dark:bg-red-900/40"
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="text-xs font-semibold uppercase tracking-widest text-ink-500 dark:text-ink-400">
              On-chain verification
            </div>
            <h1
              className={`mt-1 text-3xl sm:text-4xl font-bold tracking-tight ${
                isValid
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {isValid ? "Verified Credential" : "Revoked Credential"}
            </h1>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-400 max-w-prose">
              {isValid
                ? "This credential exists on the public blockchain, has not been revoked, and was issued by a wallet that held issuer privileges at the time."
                : "The issuing institution has invalidated this credential. It should not be considered authentic."}
            </p>
            <div className="mt-3 flex gap-2 flex-wrap print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-200 dark:ring-ink-700 dark:hover:bg-ink-800"
              >
                <Printer className="h-3.5 w-3.5" />
                Print verification
              </button>
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-200 dark:ring-ink-700 dark:hover:bg-ink-800"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy verification link"}
              </button>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-center print:hidden">
            <div className="rounded-xl bg-white p-2 ring-1 ring-ink-200 dark:ring-ink-700">
              <QRCodeSVG value={verifyUrl} size={96} level="M" />
            </div>
            <span className="mt-1.5 text-[10px] uppercase tracking-wider text-ink-500">
              Scan
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Left: details + checks */}
        <div className="space-y-5">
          <Card>
            <h2 className="text-2xl font-bold tracking-tight gradient-text">
              {credential.title}
            </h2>
            <dl className="mt-5 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-y-4 gap-x-5">
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Issued To
              </dt>
              <dd>
                <StudentBadge address={address} size="lg" />
              </dd>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Issued By
              </dt>
              <dd>
                <IssuerBadge address={credential.issuer} size="lg" />
              </dd>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Date
              </dt>
              <dd className="text-sm text-ink-900 dark:text-ink-100">
                {credential.issuedOn}
              </dd>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Status
              </dt>
              <dd>
                <Badge tone={isValid ? "success" : "danger"}>
                  {isValid ? "ACTIVE" : "REVOKED"}
                </Badge>
              </dd>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                IPFS Document
              </dt>
              <dd>
                {credential.cid ? (
                  <a
                    href={ipfsUrl(credential.cid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 text-xs font-mono break-all"
                  >
                    {credential.cid}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-ink-400">Not stored</span>
                )}
              </dd>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                CID Hash
              </dt>
              <dd>
                <code className="text-[11px] font-mono text-ink-500 dark:text-ink-500 break-all">
                  {credential.cidHash}
                </code>
              </dd>
            </dl>
          </Card>

          {/* IPFS preview */}
          {credential.cid && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-ink-500" />
                  Document preview
                </h3>
                <a
                  href={ipfsUrl(credential.cid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:underline dark:text-brand-400 inline-flex items-center gap-1"
                >
                  Open on IPFS
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {previewKind === "image" && (
                <img
                  src={ipfsUrl(credential.cid)}
                  alt={credential.title}
                  className="w-full max-h-[600px] object-contain rounded-lg bg-ink-50 dark:bg-ink-900"
                />
              )}
              {previewKind === "pdf" && (
                <iframe
                  src={ipfsUrl(credential.cid)}
                  title={credential.title}
                  className="w-full h-[640px] rounded-lg border border-ink-200 dark:border-ink-800"
                />
              )}
              {previewKind === "other" && (
                <div className="flex items-center gap-3 text-sm text-ink-500 dark:text-ink-400 rounded-lg border border-dashed border-ink-200 dark:border-ink-800 px-4 py-6">
                  <FileText className="h-5 w-5" />
                  <span>
                    Preview unavailable for this file type — open on IPFS to
                    view it.
                  </span>
                </div>
              )}
              {previewKind === null && (
                <div className="rounded-lg bg-ink-50 dark:bg-ink-900 h-40 animate-pulse" />
              )}
            </Card>
          )}
        </div>

        {/* Right: verification checks */}
        <div className="space-y-5">
          <Card>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
              <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              Verification checks
            </h3>
            <ul className="mt-3 divide-y divide-ink-100 dark:divide-ink-800">
              <CheckRow
                ok
                label="On-chain record exists"
                detail={`Credential #${credential.index} found on the smart contract.`}
              />
              <CheckRow
                ok={!credential.revoked}
                label={
                  credential.revoked
                    ? "Credential is revoked"
                    : "Credential is active"
                }
                detail={
                  credential.revoked
                    ? "Issuer has marked it revoked on-chain."
                    : "No revocation has been recorded."
                }
              />
              <CheckRow
                ok={issuerKnown}
                label={
                  issuerKnown
                    ? `Issuer registered: ${issuer.name}`
                    : "Issuer not in registry"
                }
                detail={
                  issuerKnown
                    ? "The wallet that signed this credential is a known institution."
                    : "The issuing wallet has not registered an institutional profile. Verify the wallet identity through other means."
                }
              />
              <CheckRow
                ok={!!credential.cid}
                label={
                  credential.cid
                    ? "Document hash anchored"
                    : "Document missing"
                }
                detail={
                  credential.cid
                    ? "The keccak-256 hash of the IPFS CID is stored on-chain."
                    : "No IPFS document was attached at issuance."
                }
              />
            </ul>

            <div className="mt-4 pt-4 border-t border-ink-100 dark:border-ink-800">
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Third-party accreditation
              </div>
              {issuerAccredited ? (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    <Award className="h-3 w-3" />
                    Accredited
                  </span>
                  <span className="text-xs text-ink-600 dark:text-ink-400">
                    {(issuer.accreditations || []).join(", ") || "—"}
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                  No external accreditation recorded. This is optional and does
                  not affect authenticity — the credential is still valid based
                  on the on-chain checks above.
                </p>
              )}
            </div>

            {!issuerKnown && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  The issuing wallet has not registered an institutional
                  profile. The credential may still be authentic — independently
                  confirm the issuing wallet through other means.
                </span>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
              About this verification
            </h3>
            <p className="mt-2 text-xs text-ink-600 dark:text-ink-400 leading-relaxed">
              Verification reads directly from the public blockchain — no Scholar
              Ledger account needed. Anyone with this link or QR code can
              independently re-verify the credential.
            </p>
            <Link
              to={`/profile/${address}`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              View {shortAddr(address)}'s full profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </div>

      {!isValid && (
        <Alert tone="danger" title="What does revoked mean?">
          The issuing institution has invalidated this credential. It should
          not be considered authentic for verification purposes.
        </Alert>
      )}
    </div>
  );
}

export default PublicVerify;
