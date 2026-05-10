import { useState } from "react";
import { ethers } from "ethers";
import { UserPlus, UserX, ArrowRightLeft, Crown, Loader2 } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { getContract } from "../utils/contract";
import { humanizeError } from "../utils/errors";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import useDocumentTitle from "../utils/useDocumentTitle";

const ROLE_ISSUER = 1;
const ROLE_ADMIN = 2;

function AdminPanel() {
  useDocumentTitle("Admin");
  const { account, isAdmin, isSuperAdmin, refreshRoles } = useWallet();
  const { pushToast } = useToast();

  const [grantAddr, setGrantAddr] = useState("");
  const [grantRole, setGrantRole] = useState(ROLE_ISSUER);
  const [revokeAddr, setRevokeAddr] = useState("");
  const [transferAddr, setTransferAddr] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <Alert tone="info">Connect your wallet.</Alert>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <Alert tone="warning" title="Permission required">
            Only Admins can manage roles.
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
      await refreshRoles();
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setBusy(false);
    }
  };

  const onGrant = (e) => {
    e.preventDefault();
    if (!ethers.isAddress(grantAddr)) return setError("Invalid address");
    run(async () => {
      const c = await getContract("scholarLedger");
      const tx = await c.grantRole(grantAddr, grantRole);
      await tx.wait();
      setGrantAddr("");
    }, `Role granted to ${grantAddr.slice(0, 8)}…`);
  };

  const onRevoke = (e) => {
    e.preventDefault();
    if (!ethers.isAddress(revokeAddr)) return setError("Invalid address");
    run(async () => {
      const c = await getContract("scholarLedger");
      const tx = await c.revokeRole(revokeAddr);
      await tx.wait();
      setRevokeAddr("");
    }, `Role revoked from ${revokeAddr.slice(0, 8)}…`);
  };

  const onTransfer = (e) => {
    e.preventDefault();
    if (!ethers.isAddress(transferAddr)) return setError("Invalid address");
    if (!window.confirm(
      `Transfer SUPER ADMIN to ${transferAddr}?\n\nYou will keep your ADMIN role but lose super-admin authority.`
    )) {
      return;
    }
    run(async () => {
      const c = await getContract("scholarLedger");
      const tx = await c.transferSuperAdmin(transferAddr);
      await tx.wait();
      setTransferAddr("");
    }, `Super admin transferred to ${transferAddr.slice(0, 8)}…`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Card>
        <CardHeader
          eyebrow={isSuperAdmin ? "Super admin" : "Admin"}
          title="Admin Panel"
          subtitle={
            isSuperAdmin
              ? "You hold super admin authority. Manage other admins and issuers below."
              : "Grant or revoke ISSUER and ADMIN roles for institutional staff."
          }
        />
        {error && <Alert tone="danger">{error}</Alert>}
      </Card>

      <Card>
        <CardHeader
          title="Grant Role"
          subtitle="Issuer = can issue credentials. Admin = can issue + revoke + manage roles."
        />
        <form onSubmit={onGrant} className="space-y-3">
          <Input
            label="Wallet Address"
            placeholder="0x…"
            value={grantAddr}
            onChange={(e) => setGrantAddr(e.target.value)}
          />
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={grantRole}
              onChange={(e) => setGrantRole(Number(e.target.value))}
            >
              <option value={ROLE_ISSUER}>Issuer — can issue credentials</option>
              <option value={ROLE_ADMIN}>Admin — full credential authority</option>
            </select>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {busy ? "Working…" : "Grant Role"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Revoke Role"
          subtitle="Removes the wallet's role entirely. They will no longer be able to issue or revoke credentials."
        />
        <form onSubmit={onRevoke} className="space-y-3">
          <Input
            label="Wallet Address"
            placeholder="0x…"
            value={revokeAddr}
            onChange={(e) => setRevokeAddr(e.target.value)}
          />
          <Button type="submit" variant="danger" disabled={busy}>
            <UserX className="h-4 w-4" />
            {busy ? "Working…" : "Revoke Role"}
          </Button>
        </form>
      </Card>

      {isSuperAdmin && (
        <Card>
          <CardHeader
            eyebrow="Danger zone"
            title="Transfer Super Admin"
            subtitle="Hand over super-admin authority to a new wallet. Once transferred, you can never reclaim it from your side."
          />
          <form onSubmit={onTransfer} className="space-y-3">
            <Input
              label="New Super Admin Address"
              placeholder="0x…"
              value={transferAddr}
              onChange={(e) => setTransferAddr(e.target.value)}
            />
            <Button type="submit" variant="danger" disabled={busy}>
              <ArrowRightLeft className="h-4 w-4" />
              {busy ? "Working…" : "Transfer Super Admin"}
            </Button>
          </form>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400 px-1">
        <Crown className="h-3 w-3" />
        Super admin transfers and role revocations are immediate and on-chain.
      </div>
    </div>
  );
}

export default AdminPanel;
