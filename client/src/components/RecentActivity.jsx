import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ShieldCheck } from "lucide-react";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { resolveIssuer } from "../utils/identity";
import { Skeleton } from "./ui/Skeleton";

const MAX_EVENTS = 5;
const LOOKBACK_BLOCKS = 5000;

const shortAddr = (addr) =>
  !addr ? "" : `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const relativeTime = (timestamp) => {
  if (!timestamp) return "";
  const seconds = Math.floor((Date.now() / 1000) - Number(timestamp));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

function RecentActivity() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sl = getReadOnlyContract("scholarLedger");
        const provider = sl.runner?.provider || sl.provider;
        if (!provider) {
          if (alive) setError(true);
          return;
        }

        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - LOOKBACK_BLOCKS);
        const filter = sl.filters.CredentialIssued();
        const logs = await sl.queryFilter(filter, fromBlock, latestBlock);

        const recent = logs.slice(-MAX_EVENTS).reverse();
        const enriched = await Promise.all(
          recent.map(async (log) => {
            const block = await provider.getBlock(log.blockNumber).catch(() => null);
            const issuerAddr = log.args?.issuer;
            const issuerProfile = await resolveIssuer(issuerAddr).catch(() => null);
            return {
              id: `${log.transactionHash}-${log.index}`,
              title: log.args?.title || "Credential",
              issuer: issuerProfile?.shortName || issuerProfile?.name || shortAddr(issuerAddr),
              issuerAddr,
              timestamp: block?.timestamp,
            };
          })
        );

        if (alive) setEvents(enriched);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (error) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          Recent activity
        </h2>
        <Link
          to="/verify"
          className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Verify your own →
        </Link>
      </div>

      <div className="rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 divide-y divide-ink-100 dark:divide-ink-800">
        {events === null && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        )}

        {events && events.length === 0 && (
          <div className="p-6 text-center text-xs text-ink-500 dark:text-ink-400">
            No credentials have been issued yet on this chain.
          </div>
        )}

        {events && events.length > 0 &&
          events.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex-shrink-0 mt-0.5 h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-100 truncate">
                    {e.title}
                  </p>
                  <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
                    by {e.issuer}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-ink-400 dark:text-ink-500 flex-shrink-0">
                {relativeTime(e.timestamp)}
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}

export default RecentActivity;
