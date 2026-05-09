import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Save, Trash2, ExternalLink, Loader2, User } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { getContract } from "../utils/contract";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { uploadToIPFS } from "../utils/ipfs";
import { invalidateIdentity, ipfsUrl } from "../utils/identity";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import useDocumentTitle from "../utils/useDocumentTitle";

const blank = {
  name: "",
  email: "",
  bio: "",
  photoCID: "",
  socials: { linkedin: "", github: "", twitter: "" },
};

function StudentSettings() {
  useDocumentTitle("Profile Settings");
  const { account } = useWallet();
  const { pushToast } = useToast();
  const [form, setForm] = useState(blank);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    if (!account) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const spr = getReadOnlyContract("studentProfileRegistry");
        const cid = await spr.getProfileCID(account);
        if (!alive) return;
        if (cid && cid.length > 0) {
          setHasProfile(true);
          try {
            const res = await fetch(ipfsUrl(cid), {
              signal: AbortSignal.timeout(8000),
            });
            if (res.ok && alive) {
              const json = await res.json();
              setForm({
                name: json.name || "",
                email: json.email || "",
                bio: json.bio || "",
                photoCID: json.photoCID || "",
                socials: json.socials || { linkedin: "", github: "", twitter: "" },
              });
            }
          } catch {
            // ignore
          }
        } else {
          setHasProfile(false);
          setForm(blank);
        }
      } catch (err) {
        if (alive) setError(err.reason || err.message || "Failed to load");
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
          <Alert tone="info">Connect your wallet to manage your profile.</Alert>
        </Card>
      </div>
    );
  }

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const updateSocial = (key) => (e) =>
    setForm({ ...form, socials: { ...form.socials, [key]: e.target.value } });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    try {
      let photoCID = form.photoCID;
      if (photoFile) {
        photoCID = await uploadToIPFS(photoFile);
      }
      const profile = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        bio: form.bio.trim() || undefined,
        photoCID: photoCID || undefined,
        publicProfile: true,
        socials: Object.fromEntries(
          Object.entries(form.socials).filter(([, v]) => v?.trim())
        ),
        updatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(profile, null, 2)], {
        type: "application/json",
      });
      const cid = await uploadToIPFS(
        new File([blob], "profile.json", { type: "application/json" })
      );

      const spr = await getContract("studentProfileRegistry");
      const tx = await spr.setProfile(cid);
      await tx.wait();

      invalidateIdentity(account);
      setForm({ ...form, photoCID });
      setPhotoFile(null);
      setHasProfile(true);
      pushToast({
        tone: "success",
        title: "Profile saved",
        message: "Your profile is now visible on credential pages.",
      });
    } catch (err) {
      setError(err.reason || err.message || "Transaction failed.");
    } finally {
      setBusy(false);
    }
  };

  const clearProfile = async () => {
    if (!window.confirm("Clear your on-chain profile pointer? This cannot be undone.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const spr = await getContract("studentProfileRegistry");
      const tx = await spr.clearProfile();
      await tx.wait();
      invalidateIdentity(account);
      setHasProfile(false);
      setForm(blank);
      pushToast({
        tone: "info",
        title: "Profile cleared",
        message: "Your on-chain profile pointer was removed.",
      });
    } catch (err) {
      setError(err.reason || err.message || "Clear failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader
          eyebrow="Student"
          title="My Public Profile"
          subtitle="Your profile is shown on credentials and verification pages. Stored as a JSON file on IPFS that you fully control."
        />
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Prince Kumar Singh"
              value={form.name}
              onChange={update("name")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update("email")}
            />
            <div>
              <label className="label">Bio</label>
              <textarea
                rows={3}
                className="input resize-y"
                placeholder="A brief one-line description"
                value={form.bio}
                onChange={update("bio")}
              />
            </div>

            <div>
              <label className="label">Profile Photo</label>
              <div className="rounded-lg border-2 border-dashed border-ink-200 dark:border-ink-800 p-4 transition-colors hover:border-brand-300 dark:hover:border-brand-700">
                <div className="flex items-center gap-3">
                  {form.photoCID && !photoFile ? (
                    <img
                      src={ipfsUrl(form.photoCID)}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover border border-ink-200 dark:border-ink-700 flex-shrink-0"
                    />
                  ) : (
                    <User className="h-12 w-12 text-ink-400 flex-shrink-0" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    className="block flex-1 text-sm text-ink-600 dark:text-ink-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Input
                label="LinkedIn"
                placeholder="https://linkedin.com/in/…"
                value={form.socials.linkedin}
                onChange={updateSocial("linkedin")}
              />
              <Input
                label="GitHub"
                placeholder="https://github.com/…"
                value={form.socials.github}
                onChange={updateSocial("github")}
              />
              <Input
                label="Twitter"
                placeholder="https://twitter.com/…"
                value={form.socials.twitter}
                onChange={updateSocial("twitter")}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Working…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {hasProfile ? "Update Profile" : "Save Profile"}
                  </>
                )}
              </Button>
              {hasProfile && (
                <Button
                  type="button"
                  variant="danger"
                  disabled={busy}
                  onClick={clearProfile}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Profile
                </Button>
              )}
              <Link to={`/profile/${account}`}>
                <Button type="button" variant="secondary">
                  <ExternalLink className="h-4 w-4" />
                  View Public
                </Button>
              </Link>
            </div>

            {error && <Alert tone="danger">{error}</Alert>}
          </form>
        )}
      </Card>
    </div>
  );
}

export default StudentSettings;
