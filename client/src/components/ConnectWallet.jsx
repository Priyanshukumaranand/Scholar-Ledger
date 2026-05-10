import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, Copy, Check, ExternalLink, Building2, User, Shield, LogOut } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { shortAddr, ipfsUrl, resolveIssuer, resolveStudent } from "../utils/identity";
import { humanizeError } from "../utils/errors";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

function ConnectWallet() {
  const { account, isAdmin, canIssue, isSuperAdmin, connectWallet, disconnect, isReady } = useWallet();
  const { pushToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectWallet();
    } catch (err) {
      const message = humanizeError(err);
      const isMissing =
        /metamask is not installed/i.test(err?.message || "") ||
        !window.ethereum;
      pushToast({
        tone: isMissing ? "info" : "danger",
        title: isMissing ? "MetaMask not detected" : "Connection failed",
        message: isMissing
          ? "Install the MetaMask browser extension, then refresh this page."
          : message,
      });
    } finally {
      setConnecting(false);
    }
  };

  const role = isSuperAdmin
    ? "Super Admin"
    : isAdmin
    ? "Admin"
    : canIssue
    ? "Issuer"
    : "Student";

  const tone = isSuperAdmin || isAdmin ? "brand" : canIssue ? "brand" : "neutral";

  useEffect(() => {
    let alive = true;
    setIdentity(null);
    if (!account) return;

    (async () => {
      if (canIssue && !isAdmin) {
        const issuer = await resolveIssuer(account);
        if (!alive) return;
        setIdentity({
          kind: "issuer",
          name: issuer?.name || null,
          photo: issuer?.logoCID ? ipfsUrl(issuer.logoCID) : null,
          profileLink: null,
        });
        return;
      }
      if (!isAdmin && !canIssue) {
        const student = await resolveStudent(account);
        if (!alive) return;
        setIdentity({
          kind: "student",
          name: student?.name || null,
          photo: student?.photoCID ? ipfsUrl(student.photoCID) : null,
          profileLink: `/profile/${account}`,
        });
        return;
      }
      if (alive) {
        setIdentity({ kind: "admin", name: null, photo: null, profileLink: null });
      }
    })();

    return () => {
      alive = false;
    };
  }, [account, canIssue, isAdmin]);

  const copyAddress = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  if (!account) {
    const restoring = !isReady;
    return (
      <div className="rounded-xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 shadow-card">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
              {restoring ? "Restoring session…" : "Connect your wallet"}
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              {restoring
                ? "Checking for a previously connected wallet"
                : "Required to view, issue, or manage your credentials"}
            </p>
          </div>
          <Button onClick={handleConnect} disabled={connecting || restoring}>
            <Wallet className="h-4 w-4" />
            {connecting ? "Connecting…" : restoring ? "Please wait…" : "Connect"}
          </Button>
        </div>
      </div>
    );
  }

  const kind = identity?.kind;
  const displayName = identity?.name;
  const photo = identity?.photo;

  const initials = displayName
    ? displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
    : null;

  const FallbackIcon = kind === "issuer" ? Building2 : kind === "admin" ? Shield : User;

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 shadow-card">
      <div className="flex items-center gap-3 flex-wrap">
        {photo ? (
          <img
            src={photo}
            alt=""
            className={`h-12 w-12 ${
              kind === "issuer" ? "rounded-lg" : "rounded-full"
            } object-cover border border-ink-200 dark:border-ink-700 flex-shrink-0`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : initials ? (
          <div
            className={`h-12 w-12 ${
              kind === "issuer" ? "rounded-lg" : "rounded-full"
            } bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-sm font-bold shadow-glow`}
          >
            {initials}
          </div>
        ) : (
          <div className="h-12 w-12 rounded-lg bg-ink-100 dark:bg-ink-800 flex items-center justify-center text-ink-500 dark:text-ink-400 flex-shrink-0">
            <FallbackIcon className="h-6 w-6" />
          </div>
        )}

        <div className="flex-1 min-w-[200px]">
          {displayName ? (
            <div className="text-sm font-semibold text-ink-900 dark:text-ink-100 truncate">
              {displayName}
            </div>
          ) : (
            <div className="text-sm font-semibold text-ink-500 dark:text-ink-400 italic">
              {kind === "issuer"
                ? "Institution not registered"
                : kind === "student"
                ? "Profile not set"
                : "System operator"}
            </div>
          )}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge tone={tone}>{role}</Badge>
            <span className="text-xs text-ink-500 dark:text-ink-400 font-mono">
              {shortAddr(account)}
            </span>
            <button
              onClick={copyAddress}
              className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors"
              title="Copy full address"
              aria-label="Copy full address"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {identity?.profileLink && displayName && (
              <Link
                to={identity.profileLink}
                className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                title="View public profile"
              >
                <ExternalLink className="h-3 w-3" />
                Public
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={disconnect}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-500 hover:text-ink-900 hover:bg-ink-100 dark:text-ink-400 dark:hover:text-ink-100 dark:hover:bg-ink-800 transition-colors"
          title="Disconnect wallet from this site"
        >
          <LogOut className="h-3.5 w-3.5" />
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default ConnectWallet;
