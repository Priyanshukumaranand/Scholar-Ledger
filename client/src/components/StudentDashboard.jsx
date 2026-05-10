import { useEffect, useState } from "react";
import { Search, User, FileText, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { humanizeError } from "../utils/errors";
import CredentialCard from "./CredentialCard";
import StudentBadge from "./StudentBadge";
import Card, { CardHeader } from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Alert from "./ui/Alert";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import { SkeletonCard } from "./ui/Skeleton";
import ConfirmDialog from "./ui/ConfirmDialog";

function StudentDashboard() {
  const { account, isAdmin, canIssue } = useWallet();
  const { pushToast } = useToast();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [viewedStudent, setViewedStudent] = useState("");
  const [studentInput, setStudentInput] = useState("");
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!account) return;
    setViewedStudent(account);
  }, [account]);

  useEffect(() => {
    if (!viewedStudent) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const contract = getReadOnlyContract("scholarLedger");
        const count = Number(await contract.getCredentialCount(viewedStudent));
        const creds = await Promise.all(
          Array.from({ length: count }, (_, i) =>
            contract.getCredential(viewedStudent, i)
          )
        );
        if (!alive) return;
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
        setCredentials(records);
      } catch (err) {
        if (alive) setError(humanizeError(err, "Failed to load credentials."));
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [viewedStudent]);

  const refreshCredentials = async () => {
    if (!viewedStudent) return;
    setLoading(true);
    setError("");
    try {
      const contract = getReadOnlyContract("scholarLedger");
      const count = Number(await contract.getCredentialCount(viewedStudent));
      const creds = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          contract.getCredential(viewedStudent, i)
        )
      );
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
      setCredentials(records);
    } catch (err) {
      setError(humanizeError(err, "Failed to load credentials."));
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e) => {
    e?.preventDefault?.();
    const addr = studentInput.trim();
    if (!addr || !ethers.isAddress(addr)) {
      setError("Enter a valid wallet address (0x…)");
      return;
    }
    setError("");
    setViewedStudent(addr);
  };

  const handleViewOwn = () => {
    setStudentInput("");
    setViewedStudent(account);
  };

  const askRevoke = (studentAddress, index) => {
    const cred = credentials.find((c) => c.index === index);
    setRevokeTarget({ studentAddress, index, title: cred?.title || `Credential #${index}` });
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    const { studentAddress, index } = revokeTarget;
    setRevoking(true);
    try {
      const contract = await getContract("scholarLedger");
      const tx = await contract.revokeCredential(studentAddress, index);
      await tx.wait();
      pushToast({
        tone: "success",
        title: "Credential revoked",
        message: `Credential #${index} marked revoked on-chain.`,
      });
      setRevokeTarget(null);
      refreshCredentials();
    } catch (err) {
      pushToast({
        tone: "danger",
        title: "Revoke failed",
        message: humanizeError(err),
      });
    } finally {
      setRevoking(false);
    }
  };

  if (!account) {
    return (
      <Card>
        <CardHeader title="Credential Dashboard" />
        <Alert tone="info">Connect your wallet to view credentials.</Alert>
      </Card>
    );
  }

  const active = credentials.filter((c) => !c.revoked).length;
  const revoked = credentials.length - active;
  const isMine =
    !!account &&
    !!viewedStudent &&
    viewedStudent.toLowerCase() === account.toLowerCase();

  return (
    <Card>
      <CardHeader
        eyebrow={isMine ? "Your wallet" : "Browsing"}
        title="Credential Dashboard"
        subtitle={
          isMine
            ? "Credentials issued to your wallet."
            : "Browsing another student's public credentials."
        }
        actions={
          !isMine && (
            <Button variant="secondary" size="sm" onClick={handleViewOwn}>
              <User className="h-3.5 w-3.5" />
              View Mine
            </Button>
          )
        }
      />

      {(isAdmin || canIssue) && (
        <form onSubmit={handleLookup} className="mb-5 flex flex-wrap gap-2">
          <Input
            placeholder="Look up another student's address (0x…)"
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            className="flex-1 min-w-[280px]"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
            Look up
          </Button>
        </form>
      )}

      {viewedStudent && (
        <div className="mb-5 flex items-center justify-between flex-wrap gap-3 rounded-lg bg-ink-100/60 dark:bg-ink-800/40 px-4 py-3">
          <StudentBadge address={viewedStudent} />
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="success">{active} active</Badge>
            {revoked > 0 && <Badge tone="danger">{revoked} revoked</Badge>}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {error && <Alert tone="danger">{error}</Alert>}

      {!loading && !error && credentials.length === 0 && (
        <EmptyState
          icon={FileText}
          title={isMine ? "No credentials yet" : "Nothing here"}
          description={
            isMine
              ? "Once your institution issues a credential to your wallet, it will appear here. In the meantime, set up your profile so it looks polished when one arrives."
              : "This wallet hasn't received any credentials yet."
          }
          action={
            isMine ? (
              <Link to="/profile-settings">
                <Button variant="secondary" size="sm">
                  <SettingsIcon className="h-3.5 w-3.5" />
                  Set up profile
                </Button>
              </Link>
            ) : null
          }
        />
      )}

      <div className="space-y-4 mt-4">
        {!loading &&
          credentials.map((cred) => (
            <CredentialCard
              key={cred.index}
              credential={cred}
              studentAddress={viewedStudent}
              canRevoke={isAdmin}
              onRevoke={askRevoke}
            />
          ))}
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        onCancel={() => !revoking && setRevokeTarget(null)}
        onConfirm={confirmRevoke}
        busy={revoking}
        tone="danger"
        title="Revoke this credential?"
        message={
          <>
            <p>
              You're about to revoke <strong>{revokeTarget?.title}</strong>{" "}
              (credential #{revokeTarget?.index}). The on-chain record stays,
              but its status flips to "revoked" and verification will fail
              going forward.
            </p>
            <p className="mt-2">This requires a signed transaction and cannot be undone.</p>
          </>
        }
        confirmLabel="Revoke credential"
      />
    </Card>
  );
}

export default StudentDashboard;
