import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  Award,
  ShieldCheck,
  ShieldOff,
  Search,
  ArrowRightLeft,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { getContract } from "../utils/contract";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { invalidateIdentity } from "../utils/identity";
import { humanizeError } from "../utils/errors";
import IssuerBadge from "../components/IssuerBadge";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import useDocumentTitle from "../utils/useDocumentTitle";

function AccreditationPanel() {
  useDocumentTitle("Accreditation");
  const { account, isAccreditationAuthority, refreshRoles } = useWallet();
  const { pushToast } = useToast();

  const [issuerAddr, setIssuerAddr] = useState("");
  const [label, setLabel] = useState("");
  const [transferAddr, setTransferAddr] = useState("");
  const [lookup, setLookup] = useState("");
  const [lookupResult, setLookupResult] = useState(null);

  const [authority, setAuthority] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = getReadOnlyContract("accreditationRegistry");
        const a = await c.accreditationAuthority();
        if (alive) setAuthority(a);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [account]);

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <Alert tone="info">Connect your wallet.</Alert>
        </Card>
      </div>
    );
  }

  if (!isAccreditationAuthority) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader title="Accreditation Panel" />
          <Alert tone="warning" title="Permission required">
            Only the accreditation authority can grant or remove accreditations.
            {authority && (
              <p className="mt-2 text-xs font-mono break-all">
                Current authority: {authority}
              </p>
            )}
          </Alert>
        </Card>
      </div>
    );
  }

  const run = async (fn, successMsg) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      pushToast({ tone: "success", title: "Success", message: successMsg });
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setBusy(false);
    }
  };

  const onAccredit = (e) => {
    e.preventDefault();
    if (!ethers.isAddress(issuerAddr)) return setError("Invalid issuer address");
    if (!label.trim()) return setError("Label required (e.g. UGC, AICTE)");
    run(async () => {
      const c = await getContract("accreditationRegistry");
      const tx = await c.accredit(issuerAddr, label.trim());
      await tx.wait();
      invalidateIdentity(issuerAddr);
      setIssuerAddr("");
      setLabel("");
    }, "Accreditation granted.");
  };

  const onRemove = (e) => {
    e.preventDefault();
    if (!ethers.isAddress(issuerAddr)) return setError("Invalid issuer address");
    if (!label.trim()) return setError("Label required");
    run(async () => {
      const c = await getContract("accreditationRegistry");
      const tx = await c.removeAccreditation(issuerAddr, label.trim());
      await tx.wait();
      invalidateIdentity(issuerAddr);
      setIssuerAddr("");
      setLabel("");
    }, "Accreditation removed.");
  };

  const onTransfer = (e) => {
    e.preventDefault();
    if (!ethers.isAddress(transferAddr)) return setError("Invalid address");
    if (!window.confirm(`Transfer authority to ${transferAddr}?`)) return;
    run(async () => {
      const c = await getContract("accreditationRegistry");
      const tx = await c.transferAuthority(transferAddr);
      await tx.wait();
      setTransferAddr("");
      await refreshRoles();
    }, "Authority transferred.");
  };

  const onLookup = async (e) => {
    e.preventDefault();
    setLookupResult(null);
    if (!ethers.isAddress(lookup)) {
      setError("Invalid address");
      return;
    }
    try {
      const c = getReadOnlyContract("accreditationRegistry");
      const [accredited, labels] = await Promise.all([
        c.isAccredited(lookup),
        c.getAccreditations(lookup),
      ]);
      setLookupResult({ address: lookup, accredited, labels });
    } catch (err) {
      setError(humanizeError(err, "Lookup failed"));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Card>
        <CardHeader
          eyebrow="Authority"
          title="Accreditation Panel"
          subtitle="You are the accreditation authority. Mark issuer wallets as accredited so verifiers see the badge."
        />
        {error && <Alert tone="danger">{error}</Alert>}
      </Card>

      <Card>
        <CardHeader title="Grant or Remove Accreditation" />
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <Input
            label="Issuer Wallet Address"
            placeholder="0x…"
            value={issuerAddr}
            onChange={(e) => setIssuerAddr(e.target.value)}
          />
          <Input
            label="Accreditation Label"
            placeholder="e.g. UGC, AICTE, NAAC A++"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            <Button type="button" onClick={onAccredit} disabled={busy} variant="success">
              <ShieldCheck className="h-4 w-4" />
              {busy ? "Working…" : "Grant Accreditation"}
            </Button>
            <Button type="button" onClick={onRemove} variant="danger" disabled={busy}>
              <ShieldOff className="h-4 w-4" />
              {busy ? "Working…" : "Remove"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Look up Issuer" />
        <form onSubmit={onLookup} className="space-y-3">
          <Input
            label="Issuer Address"
            placeholder="0x…"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
            Look up
          </Button>
        </form>
        {lookupResult && (
          <div className="mt-4 space-y-3 rounded-lg bg-ink-50 dark:bg-ink-800/40 p-4">
            <IssuerBadge address={lookupResult.address} size="lg" />
            <div className="flex gap-2 flex-wrap">
              <Badge tone={lookupResult.accredited ? "success" : "neutral"}>
                {lookupResult.accredited ? "Accredited" : "Not accredited"}
              </Badge>
              {lookupResult.labels.map((l) => (
                <Badge key={l} tone="brand">
                  <Award className="h-3 w-3" />
                  {l}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          eyebrow="Danger zone"
          title="Transfer Authority"
          subtitle="Hand over accreditation control to another wallet."
        />
        <form onSubmit={onTransfer} className="space-y-3">
          <Input
            label="New Authority Address"
            placeholder="0x…"
            value={transferAddr}
            onChange={(e) => setTransferAddr(e.target.value)}
          />
          <Button type="submit" variant="danger" disabled={busy}>
            <ArrowRightLeft className="h-4 w-4" />
            {busy ? "Working…" : "Transfer Authority"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default AccreditationPanel;
