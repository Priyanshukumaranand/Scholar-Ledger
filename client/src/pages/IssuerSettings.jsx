import { useEffect, useState } from "react";
import { Building2, Save, Loader2, Mail } from "lucide-react";
import { getContract } from "../utils/contract";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { uploadToIPFS } from "../utils/ipfs";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { invalidateIdentity, ipfsUrl } from "../utils/identity";
import { humanizeError } from "../utils/errors";
import {
  getNotifyEnabled,
  getNotifyToken,
  setNotifyEnabled,
  setNotifyToken,
} from "../utils/notify";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import { SkeletonText } from "../components/ui/Skeleton";
import useDocumentTitle from "../utils/useDocumentTitle";

const blank = {
  name: "",
  shortName: "",
  country: "",
  websiteUrl: "",
  logoCID: "",
};

function IssuerSettings() {
  useDocumentTitle("Issuer Settings");
  const { account, canIssue } = useWallet();
  const { pushToast } = useToast();
  const [form, setForm] = useState(blank);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [notifyEnabled, setNotifyEnabledState] = useState(getNotifyEnabled());
  const [notifyToken, setNotifyTokenState] = useState(getNotifyToken());

  const onNotifyToggle = (next) => {
    setNotifyEnabledState(next);
    setNotifyEnabled(next);
  };
  const onNotifyTokenSave = () => {
    setNotifyToken(notifyToken.trim());
    pushToast({
      tone: "success",
      title: "Saved",
      message: notifyToken.trim() ? "API token stored locally." : "API token cleared.",
    });
  };

  useEffect(() => {
    if (!account) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const ir = getReadOnlyContract("issuerRegistry");
        const data = await ir.getInstitution(account);
        if (!alive) return;
        if (data[7]) {
          setRegistered(true);
          setForm({
            name: data[0],
            shortName: data[1],
            country: data[2],
            websiteUrl: data[3],
            logoCID: data[4],
          });
        } else {
          setRegistered(false);
          setForm(blank);
        }
      } catch (err) {
        if (alive) setError(humanizeError(err, "Failed to load"));
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [account]);

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <Alert tone="info">Connect your wallet to manage your institution profile.</Alert>
        </Card>
      </div>
    );
  }

  if (!canIssue) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <Alert tone="warning" title="Permission required">
            Only wallets with Issuer or Admin role can register an institution.
            Ask the system admin to grant you a role.
          </Alert>
        </Card>
      </div>
    );
  }

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Institution name is required.");
      return;
    }
    setBusy(true);
    try {
      let logoCID = form.logoCID;
      if (logoFile) {
        logoCID = await uploadToIPFS(logoFile);
      }
      const ir = await getContract("issuerRegistry");
      const args = [
        form.name.trim(),
        form.shortName.trim(),
        form.country.trim(),
        form.websiteUrl.trim(),
        logoCID,
      ];
      const tx = registered
        ? await ir.updateInstitution(...args)
        : await ir.registerInstitution(...args);
      await tx.wait();
      invalidateIdentity(account);
      setForm({ ...form, logoCID });
      setLogoFile(null);
      setRegistered(true);
      pushToast({
        tone: "success",
        title: registered ? "Institution updated" : "Institution registered",
        message: form.name.trim(),
      });
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Card>
        <CardHeader
          eyebrow="Issuer"
          title={registered ? "Edit Institution" : "Register Institution"}
          subtitle={
            registered
              ? "Update the public profile shown on credentials issued by this wallet."
              : "Register this wallet as an issuing institution. Anyone verifying your credentials will see this metadata."
          }
        />
        {loading ? (
          <SkeletonText lines={5} />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Institution Name *"
              placeholder="e.g. Indian Institute of Technology Delhi"
              value={form.name}
              onChange={update("name")}
            />
            <Input
              label="Short Name"
              placeholder="e.g. IIT Delhi"
              value={form.shortName}
              onChange={update("shortName")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Country"
                placeholder="e.g. IN"
                value={form.country}
                onChange={update("country")}
                helper="ISO 3166-1 alpha-2"
              />
              <Input
                label="Website"
                placeholder="https://…"
                value={form.websiteUrl}
                onChange={update("websiteUrl")}
              />
            </div>

            <div>
              <label className="label">Logo</label>
              <div className="rounded-lg border-2 border-dashed border-ink-200 dark:border-ink-800 p-4 transition-colors hover:border-brand-300 dark:hover:border-brand-700">
                <div className="flex items-center gap-3">
                  {form.logoCID && !logoFile ? (
                    <img
                      src={ipfsUrl(form.logoCID)}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover border border-ink-200 dark:border-ink-700 flex-shrink-0"
                    />
                  ) : (
                    <Building2 className="h-12 w-12 text-ink-400 flex-shrink-0" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    className="block flex-1 text-sm text-ink-600 dark:text-ink-300 cursor-pointer"
                  />
                </div>
              </div>
              <p className="helper">
                Upload a PNG/SVG logo to IPFS. Used as the avatar shown next to
                credentials issued by this wallet.
              </p>
            </div>

            <div className="pt-1">
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Working…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {registered ? "Update Profile" : "Register Institution"}
                  </>
                )}
              </Button>
            </div>

            {error && <Alert tone="danger">{error}</Alert>}
          </form>
        )}
      </Card>

      <Card>
        <CardHeader
          eyebrow="Optional"
          title="Email notifications"
          subtitle="When enabled, students with an email on their profile receive an email after you issue or revoke a credential."
        />
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              checked={notifyEnabled}
              onChange={(e) => onNotifyToggle(e.target.checked)}
            />
            <div>
              <div className="text-sm font-medium text-ink-900 dark:text-ink-100">
                Send email notifications
              </div>
              <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                Best-effort. If a student's profile has no email or the backend
                isn't configured, the call is silently skipped.
              </div>
            </div>
          </label>

          <div>
            <label className="label flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Notify API token
            </label>
            <div className="flex gap-2 flex-wrap">
              <input
                type="password"
                className="input flex-1 min-w-[260px] font-mono text-xs"
                placeholder="Stored only in this browser's localStorage"
                value={notifyToken}
                onChange={(e) => setNotifyTokenState(e.target.value)}
                autoComplete="off"
              />
              <Button variant="secondary" size="sm" onClick={onNotifyTokenSave}>
                Save token
              </Button>
            </div>
            <p className="helper">
              The token must match <code className="font-mono">NOTIFY_API_TOKEN</code>{" "}
              on the backend. Ask your admin if you don't have one.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default IssuerSettings;
