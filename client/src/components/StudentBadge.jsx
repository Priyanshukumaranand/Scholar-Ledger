import { useEffect, useState } from "react";
import { resolveStudent, shortAddr, ipfsUrl } from "../utils/identity";

/**
 * Renders a student's name + photo, falling back to the address.
 */
function StudentBadge({ address, size = "md" }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!address) return;
    resolveStudent(address).then((p) => {
      if (alive) setProfile(p);
    });
    return () => {
      alive = false;
    };
  }, [address]);

  if (!address) return null;

  const isLg = size === "lg";
  const imgSize = isLg ? "h-12 w-12" : "h-7 w-7";
  const nameClass = isLg ? "text-base font-semibold" : "text-sm font-medium";
  const photo = profile?.photoCID ? ipfsUrl(profile.photoCID) : null;

  return (
    <div className="flex items-center gap-2">
      {photo ? (
        <img
          src={photo}
          alt=""
          className={`${imgSize} rounded-full object-cover border border-ink-200 dark:border-ink-700`}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div
          className={`${imgSize} rounded-full bg-gradient-to-br from-ink-400 to-ink-600 text-white flex items-center justify-center text-xs font-bold uppercase`}
        >
          {(profile?.name || "?").slice(0, 2)}
        </div>
      )}
      <div className="min-w-0">
        {profile?.name ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className={nameClass + " text-ink-900 dark:text-ink-100"}>
              {profile.name}
            </span>
            <span className="text-xs text-ink-400 font-mono">
              ({shortAddr(address)})
            </span>
          </div>
        ) : (
          <span className="font-mono text-xs text-ink-600 dark:text-ink-400">
            {shortAddr(address)}
          </span>
        )}
        {profile?.bio && size === "lg" && (
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400 line-clamp-1">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );
}

export default StudentBadge;
