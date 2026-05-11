import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Linkedin,
  Github,
  Twitter,
  Mail,
  Globe,
} from "lucide-react";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { resolveStudent, resolveIssuer, ipfsUrl } from "../utils/identity";
import { humanizeError } from "../utils/errors";
import IssuerBadge from "../components/IssuerBadge";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Alert from "../components/ui/Alert";
import useDocumentTitle from "../utils/useDocumentTitle";

function StatCard({ value, label, tone = "neutral" }) {
  const tones = {
    success: "text-emerald-600 dark:text-emerald-400",
    danger: "text-red-600 dark:text-red-400",
    neutral: "text-brand-600 dark:text-brand-400",
  };
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 text-center dark:border-ink-800 dark:bg-ink-900">
      <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${tones[tone]}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400">
        {label}
      </div>
    </div>
  );
}

const isSafeHttpUrl = (url) => {
  try {
    const u = new URL(String(url));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

function PublicProfile() {
  const { address } = useParams();
  useDocumentTitle(address ? `Profile · ${address.slice(0, 8)}…` : "Profile");
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [issuer, setIssuer] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const contract = getReadOnlyContract("scholarLedger");
        const count = Number(await contract.getCredentialCount(address));
        const [creds, studentProfile, issuerProfile] = await Promise.all([
          Promise.all(
            Array.from({ length: count }, (_, i) =>
              contract.getCredential(address, i)
            )
          ),
          resolveStudent(address),
          resolveIssuer(address),
        ]);
        const records = creds.map((cred, i) => ({
          index: i,
          cidHash: cred[0],
          cid: cred[1],
          title: cred[2],
          issuedOn: new Date(Number(cred[3]) * 1000).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          revoked: cred[4],
          issuer: cred[5],
        }));
        if (!alive) return;
        setCredentials(records);
        setProfile(studentProfile);
        setIssuer(issuerProfile);
      } catch (err) {
        if (!alive) return;
        setError(humanizeError(err, "Could not load profile."));
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [address]);

  const profileUrl = window.location.href;
  const copyProfile = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const active = credentials.filter((c) => !c.revoked);
  const revoked = credentials.filter((c) => c.revoked);
  const socials = profile?.socials || {};

  // Resolve persona, picking the most-specific identity we have for this wallet.
  const isInstitution = !!issuer?.exists;
  const isStudent = !isInstitution && !!profile?.name;
  const persona = isInstitution ? "institution" : isStudent ? "student" : "unknown";

  const addrInitials = address ? address.slice(2, 4).toUpperCase() : "??";

  const display = isInstitution
    ? {
        eyebrow: "Issuing Institution",
        title: issuer.name || issuer.shortName || "Registered Institution",
        bio: [issuer.country, issuer.websiteUrl].filter(Boolean).join(" · "),
        photoSrc: issuer.logoCID ? ipfsUrl(issuer.logoCID) : null,
        initials: (issuer.name || issuer.shortName || addrInitials).slice(0, 2).toUpperCase(),
      }
    : isStudent
    ? {
        eyebrow: "Student",
        title: profile.name,
        bio: profile.bio || "",
        photoSrc: profile.photoCID ? ipfsUrl(profile.photoCID) : null,
        initials: (profile.name || addrInitials).slice(0, 2).toUpperCase(),
      }
    : {
        eyebrow: "Public Wallet",
        title: "Credential Profile",
        bio: "",
        photoSrc: null,
        initials: addrInitials,
      };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-brand-500" />
        <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">
          Loading profile from blockchain…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-7 sm:p-9 text-white shadow-elevated">
        <div className="absolute inset-0 bg-dot-pattern opacity-30 [background-size:24px_24px]" />
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center gap-6">
          {display.photoSrc ? (
            <img
              src={display.photoSrc}
              alt={display.title}
              className="h-24 w-24 rounded-2xl object-cover border-2 border-white/20 shadow-elevated bg-white/10"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-white/15 border-2 border-white/20 flex items-center justify-center text-3xl font-bold uppercase backdrop-blur">
              {display.initials}
            </div>
          )}
          <div className="flex-1 min-w-[260px]">
            <div className="text-[10px] sm:text-xs uppercase tracking-widest opacity-80">
              {display.eyebrow}
            </div>
            <h1 className="mt-1 text-2xl sm:text-4xl font-bold tracking-tighter">
              {display.title}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm font-mono opacity-75 break-all">
              {address}
            </p>
            {display.bio && (
              <p className="mt-3 text-sm opacity-90 max-w-xl leading-relaxed">
                {display.bio}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2 items-center">
              <button
                onClick={copyProfile}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-ink-50"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy Profile Link"}
              </button>
              {persona === "institution" && isSafeHttpUrl(issuer.websiteUrl) && (
                <a
                  href={issuer.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Website"
                >
                  <Globe className="h-3.5 w-3.5" />
                </a>
              )}
              {persona === "student" && profile?.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Email"
                >
                  <Mail className="h-3.5 w-3.5" />
                </a>
              )}
              {persona === "student" && isSafeHttpUrl(socials.linkedin) && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
              )}
              {persona === "student" && isSafeHttpUrl(socials.github) && (
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="GitHub"
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
              )}
              {persona === "student" && isSafeHttpUrl(socials.twitter) && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Twitter"
                >
                  <Twitter className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-elevated">
            <QRCodeSVG value={profileUrl} size={108} level="M" />
          </div>
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {!error && credentials.length === 0 && (
        <Card>
          <p className="text-center text-ink-500 dark:text-ink-400 py-8">
            {persona === "institution"
              ? "This wallet is registered as an issuing institution. It hasn't received any credentials itself."
              : "No credentials have been issued to this address yet."}
          </p>
        </Card>
      )}

      {!error && credentials.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard value={active.length} label="Active" tone="success" />
            <StatCard value={revoked.length} label="Revoked" tone="danger" />
            <StatCard value={credentials.length} label="Total" tone="neutral" />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 px-1">
              Credentials
            </h2>
            {credentials.map((cred) => (
              <Link
                key={cred.index}
                to={`/verify/${address}/${cred.index}`}
                className={`group block rounded-xl border p-4 sm:p-5 transition-all hover:shadow-elevated hover:-translate-y-0.5 ${
                  cred.revoked
                    ? "border-red-200 bg-red-50/40 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/20"
                    : "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                }`}
              >
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">
                      {cred.title}
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                      Issued {cred.issuedOn}
                    </p>
                    <div className="mt-3">
                      <IssuerBadge address={cred.issuer} />
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <Badge tone={cred.revoked ? "danger" : "success"}>
                      {cred.revoked ? "REVOKED" : "ACTIVE"}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-500 dark:text-ink-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      View
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <p className="text-xs text-center text-ink-500 dark:text-ink-400 pt-2">
            All credentials anchored on a public blockchain. Verifiers can
            independently confirm authenticity at the URL above.
          </p>
        </>
      )}
    </div>
  );
}

export default PublicProfile;
