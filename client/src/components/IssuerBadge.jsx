import { useEffect, useState } from "react";
import { resolveIssuer, shortAddr, ipfsUrl } from "../utils/identity";
import Badge from "./ui/Badge";

/**
 * Renders an issuer's institution name (with logo + accreditation) and
 * falls back to the wallet address with a warning badge if unregistered.
 */
function IssuerBadge({ address, size = "md", showAccreditation = true }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!address) return;
    resolveIssuer(address).then((p) => {
      if (alive) setProfile(p);
    });
    return () => {
      alive = false;
    };
  }, [address]);

  if (!address) return null;

  const isLg = size === "lg";
  const imgSize = isLg ? "h-10 w-10" : "h-7 w-7";
  const nameClass = isLg
    ? "text-base font-semibold"
    : "text-sm font-medium";

  const display = profile?.exists ? profile.name : null;
  const logo = profile?.logoCID ? ipfsUrl(profile.logoCID) : null;

  return (
    <div className="flex items-center gap-2">
      {logo ? (
        <img
          src={logo}
          alt=""
          className={`${imgSize} rounded-full object-cover border border-ink-200 dark:border-ink-700`}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div
          className={`${imgSize} rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center text-xs font-bold uppercase`}
        >
          {(profile?.shortName || profile?.name || "?").slice(0, 2)}
        </div>
      )}
      <div className="min-w-0">
        {display ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className={nameClass + " text-ink-900 dark:text-ink-100"}>
              {display}
            </span>
            <span className="text-xs text-ink-400 font-mono">
              ({shortAddr(address)})
            </span>
            {showAccreditation && profile.accredited && (
              <Badge tone="success">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Accredited
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-ink-600 dark:text-ink-400">
              {shortAddr(address)}
            </span>
            <Badge tone="warning">Unregistered issuer</Badge>
          </div>
        )}
        {profile?.accreditations?.length > 0 && showAccreditation && size === "lg" && (
          <div className="mt-1 flex flex-wrap gap-1">
            {profile.accreditations.map((label) => (
              <span
                key={label}
                className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IssuerBadge;
