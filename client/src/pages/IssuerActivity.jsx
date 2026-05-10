import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Send,
  XCircle,
  Filter,
  Download,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { humanizeError } from "../utils/errors";
import StudentBadge from "../components/StudentBadge";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import useDocumentTitle from "../utils/useDocumentTitle";

const LOOKBACK_BLOCKS = 50000;

const formatDate = (ts) => {
  if (!ts) return "—";
  return new Date(Number(ts) * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function IssuerActivity() {
  useDocumentTitle("Activity");
  const { account, canIssue, isReady } = useWallet();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!account || !canIssue) return;
    let alive = true;
    (async () => {
      try {
        const sl = getReadOnlyContract("scholarLedger");
        const provider = sl.runner?.provider || sl.provider;
        if (!provider) throw new Error("Provider unavailable.");

        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - LOOKBACK_BLOCKS);

        // CredentialIssued(student, index, cidHash, title, issuer) — non-indexed
        // cidHash/title must be null when filtering on indexed issuer.
        const issuedFilter = sl.filters.CredentialIssued(
          null,
          null,
          null,
          null,
          account
        );
        const revokedFilter = sl.filters.CredentialRevoked(null, null, account);

        const [issuedLogs, revokedLogs] = await Promise.all([
          sl.queryFilter(issuedFilter, fromBlock, latestBlock),
          sl.queryFilter(revokedFilter, fromBlock, latestBlock),
        ]);

        const enrich = async (log, kind) => {
          const block = await provider.getBlock(log.blockNumber).catch(() => null);
          return {
            id: `${log.transactionHash}-${log.index}`,
            kind,
            student: log.args?.student,
            index: Number(log.args?.index ?? 0),
            title: log.args?.title || null,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: block?.timestamp,
          };
        };

        const all = await Promise.all([
          ...issuedLogs.map((l) => enrich(l, "issued")),
          ...revokedLogs.map((l) => enrich(l, "revoked")),
        ]);
        all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (alive) setEvents(all);
      } catch (err) {
        if (alive) setError(humanizeError(err, "Failed to load activity."));
      }
    })();
    return () => {
      alive = false;
    };
  }, [account, canIssue]);

  const filtered = useMemo(() => {
    if (!events) return null;
    if (filter === "all") return events;
    return events.filter((e) => e.kind === filter);
  }, [events, filter]);

  const exportCsv = () => {
    if (!events || events.length === 0) return;
    const lines = ["timestamp,kind,student,index,title,tx_hash,block"];
    events.forEach((e) => {
      const safe = (s) => String(s ?? "").replace(/[",\n]/g, " ").trim();
      lines.push(
        [
          new Date(Number(e.timestamp || 0) * 1000).toISOString(),
          e.kind,
          e.student,
          e.index,
          safe(e.title),
          e.txHash,
          e.blockNumber,
        ].join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issuer-activity-${account.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isReady) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-3" />
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <Alert tone="info">Connect your wallet to view your activity.</Alert>
        </Card>
      </div>
    );
  }

  if (!canIssue) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <Alert tone="warning" title="Not an issuer">
            Only wallets with issuer privileges have an activity log.
          </Alert>
        </Card>
      </div>
    );
  }

  const issuedCount = events?.filter((e) => e.kind === "issued").length || 0;
  const revokedCount = events?.filter((e) => e.kind === "revoked").length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Card>
        <CardHeader
          eyebrow="Issuer"
          title="Activity Log"
          subtitle={`Credential events emitted by your wallet over the last ~${LOOKBACK_BLOCKS.toLocaleString()} blocks.`}
          actions={
            events && events.length > 0 ? (
              <Button size="sm" variant="secondary" onClick={exportCsv}>
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            ) : null
          }
        />

        {error && <Alert tone="danger">{error}</Alert>}

        {events && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
              <Filter className="h-3 w-3" />
              Filter:
            </span>
            {[
              { id: "all", label: `All (${events.length})` },
              { id: "issued", label: `Issued (${issuedCount})` },
              { id: "revoked", label: `Revoked (${revokedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filter === f.id
                    ? "bg-brand-600 text-white"
                    : "bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        {events === null && !error && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {filtered && filtered.length === 0 && (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description={
              filter === "all"
                ? "Once you issue or revoke credentials, they'll appear here."
                : "No events match the current filter."
            }
          />
        )}

        {filtered && filtered.length > 0 && (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {filtered.map((e) => (
              <li
                key={e.id}
                className="py-3 flex items-start gap-3 flex-wrap"
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    e.kind === "issued"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                  }`}
                >
                  {e.kind === "issued" ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={e.kind === "issued" ? "success" : "danger"}>
                      {e.kind === "issued" ? "Issued" : "Revoked"}
                    </Badge>
                    {e.title && (
                      <span className="text-sm font-medium text-ink-900 dark:text-ink-100">
                        {e.title}
                      </span>
                    )}
                    <span className="text-xs text-ink-500 dark:text-ink-400">
                      #{e.index}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <StudentBadge address={e.student} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-500 dark:text-ink-400 flex-wrap">
                    <span>{formatDate(e.timestamp)}</span>
                    <span>·</span>
                    <span className="font-mono">block {e.blockNumber}</span>
                    <span>·</span>
                    <Link
                      to={`/verify/${e.student}/${e.index}`}
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default IssuerActivity;
