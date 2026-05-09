import { useEffect, useState } from "react";
import { Search, User, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import CredentialCard from "./CredentialCard";
import StudentBadge from "./StudentBadge";
import Card, { CardHeader } from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Alert from "./ui/Alert";
import Badge from "./ui/Badge";

function StudentDashboard() {
  const { account, isAdmin, canIssue } = useWallet();
  const { pushToast } = useToast();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [viewedStudent, setViewedStudent] = useState("");
  const [studentInput, setStudentInput] = useState("");

  useEffect(() => {
    if (!account) return;
    setViewedStudent(account);
  }, [account]);

  useEffect(() => {
    if (!viewedStudent) return;
    loadCredentials(viewedStudent);
  }, [viewedStudent]);

  const loadCredentials = async (studentAddress) => {
    setLoading(true);
    setError("");
    try {
      const contract = getReadOnlyContract("scholarLedger");
      const count = Number(await contract.getCredentialCount(studentAddress));
      const creds = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          contract.getCredential(studentAddress, i)
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
      setError(err.reason || err.message || "Failed to load credentials.");
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

  const handleRevoke = async (studentAddress, index) => {
    try {
      const contract = await getContract("scholarLedger");
      const tx = await contract.revokeCredential(studentAddress, index);
      await tx.wait();
      pushToast({
        tone: "success",
        title: "Credential revoked",
        message: `Credential #${index} marked revoked on-chain.`,
      });
      loadCredentials(studentAddress);
    } catch (err) {
      pushToast({
        tone: "danger",
        title: "Revoke failed",
        message: err.reason || err.message || "Transaction failed.",
      });
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
        <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading credentials…
        </div>
      )}
      {error && <Alert tone="danger">{error}</Alert>}

      {!loading && !error && credentials.length === 0 && (
        <Alert tone="info">No credentials issued to this address yet.</Alert>
      )}

      <div className="space-y-4 mt-4">
        {!loading &&
          credentials.map((cred) => (
            <CredentialCard
              key={cred.index}
              credential={cred}
              studentAddress={viewedStudent}
              canRevoke={isAdmin}
              onRevoke={handleRevoke}
            />
          ))}
      </div>
    </Card>
  );
}

export default StudentDashboard;
