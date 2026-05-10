import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { ipfsUrl, shortAddr } from "../utils/identity";
import { humanizeError } from "../utils/errors";
import IssuerBadge from "../components/IssuerBadge";
import StudentBadge from "../components/StudentBadge";
import Card from "../components/ui/Card";
import useDocumentTitle from "../utils/useDocumentTitle";
import Badge from "../components/ui/Badge";
import Alert from "../components/ui/Alert";

function DetailRow({ label, children }) {
  return (
    <>
      <dt className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
        {label}
      </dt>
      <dd className="text-sm text-ink-900 dark:text-ink-100">{children}</dd>
    </>
  );
}

function PublicVerify() {
  const { address, index } = useParams();
  useDocumentTitle("Verify Credential");
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setCredential({
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
        });
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
  const verifyUrl = window.location.href;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Status banner */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 p-7 text-center ${
          isValid
            ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-800/60 dark:from-emerald-950/30 dark:to-ink-900"
            : "border-red-300 bg-gradient-to-br from-red-50 to-white dark:border-red-800/60 dark:from-red-950/30 dark:to-ink-900"
        }`}
      >
        <div
          className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-3 ${
            isValid
              ? "bg-emerald-100 dark:bg-emerald-900/40"
              : "bg-red-100 dark:bg-red-900/40"
          }`}
        >
          {isValid ? (
            <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="h-9 w-9 text-red-600 dark:text-red-400" />
          )}
        </div>
        <h1
          className={`text-2xl sm:text-3xl font-bold tracking-tight ${
            isValid
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-red-700 dark:text-red-300"
          }`}
        >
          {isValid ? "Valid Credential" : "Revoked Credential"}
        </h1>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
          Independently verified against the public blockchain.
        </p>
      </div>

      {/* Credential details */}
      <Card>
        <h2 className="text-2xl font-bold tracking-tight gradient-text">
          {credential.title}
        </h2>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-y-5 gap-x-5">
          <DetailRow label="Issued To">
            <StudentBadge address={address} size="lg" />
          </DetailRow>

          <DetailRow label="Issued By">
            <IssuerBadge address={credential.issuer} size="lg" />
          </DetailRow>

          <DetailRow label="Date">{credential.issuedOn}</DetailRow>

          <DetailRow label="Status">
            <Badge tone={isValid ? "success" : "danger"}>
              {isValid ? "ACTIVE" : "REVOKED"}
            </Badge>
          </DetailRow>

          {credential.cid && (
            <DetailRow label="IPFS Document">
              <a
                href={ipfsUrl(credential.cid)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 text-sm font-mono break-all"
              >
                {credential.cid}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </DetailRow>
          )}

          <DetailRow label="CID Hash">
            <code className="text-xs font-mono text-ink-500 dark:text-ink-500 break-all">
              {credential.cidHash}
            </code>
          </DetailRow>
        </dl>
      </Card>

      {/* QR + share */}
      <Card>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="rounded-xl bg-white p-3 ring-1 ring-ink-200 dark:ring-ink-700">
            <QRCodeSVG value={verifyUrl} size={120} level="M" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
              Share this verification
            </h3>
            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              Anyone with this QR or link can re-verify the credential without
              installing anything or signing in.
            </p>
            <div className="mt-3">
              <Link
                to={`/profile/${address}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                View {shortAddr(address)}'s full profile
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </Card>

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
