import { useRef, useState } from "react";
import { ethers } from "ethers";
import { FilePlus, Send, FileText } from "lucide-react";
import { uploadToIPFS } from "../utils/ipfs";
import { getContract } from "../utils/contract";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { humanizeError } from "../utils/errors";
import useFormDraft from "../utils/useFormDraft";
import { rememberTitle } from "../utils/credentialPresets";
import Card, { CardHeader } from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Alert from "./ui/Alert";
import TitleCombobox from "./ui/TitleCombobox";

const DRAFT_BLANK = { studentAddress: "", title: "" };

function UploadCredential() {
  const { canIssue, account } = useWallet();
  const { pushToast } = useToast();
  const [draft, setDraft, clearDraft] = useFormDraft(
    `upload-credential:${account || "anon"}`,
    DRAFT_BLANK
  );
  const [file, setFile] = useState(null);
  const [cid, setCid] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  if (!canIssue) return null;

  const studentAddress = draft.studentAddress;
  const title = draft.title;
  const setStudentAddress = (v) => setDraft((d) => ({ ...d, studentAddress: v }));
  const setTitle = (v) => setDraft((d) => ({ ...d, title: v }));

  const reset = () => {
    setDraft(DRAFT_BLANK);
    clearDraft();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setCid("");

    const addr = studentAddress.trim();
    const trimmedTitle = title.trim();

    if (!ethers.isAddress(addr)) {
      setError("Enter a valid student wallet address (0x…)");
      return;
    }
    if (!trimmedTitle) {
      setError("Credential title is required");
      return;
    }
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setBusy(true);
    try {
      setStatus("Uploading document to IPFS…");
      const ipfsCid = await uploadToIPFS(file);
      setCid(ipfsCid);

      setStatus("Anchoring credential on-chain…");
      const contract = await getContract("scholarLedger");
      const cidHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsCid));
      const tx = await contract.issueCredential(addr, cidHash, ipfsCid, trimmedTitle);
      await tx.wait();

      rememberTitle(account, trimmedTitle);
      setStatus("");
      reset();
      pushToast({
        tone: "success",
        title: "Credential issued",
        message: `${trimmedTitle} anchored on-chain successfully.`,
      });
    } catch (err) {
      setStatus("");
      setError(humanizeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        eyebrow="Issue"
        title="Issue a Credential"
        subtitle="Upload a document, anchor its hash on-chain, and assign it to a student wallet."
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Student Wallet Address"
          placeholder="0x…"
          value={studentAddress}
          onChange={(e) => setStudentAddress(e.target.value)}
        />
        <TitleCombobox
          value={title}
          onChange={setTitle}
          issuerAddr={account}
        />
        <div>
          <label className="label">Document</label>
          <div className="rounded-lg border-2 border-dashed border-ink-200 dark:border-ink-800 p-4 transition-colors hover:border-brand-300 dark:hover:border-brand-700">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-ink-400 flex-shrink-0" />
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="block flex-1 text-sm text-ink-600 dark:text-ink-300 cursor-pointer"
              />
            </div>
            {file && (
              <p className="mt-2 text-xs text-ink-600 dark:text-ink-400 font-mono break-all">
                Selected: {file.name}
              </p>
            )}
          </div>
          <p className="helper">
            PDF or image. Uploaded to IPFS via Pinata; only its hash + CID are
            stored on-chain.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? (
              <>
                <Send className="h-4 w-4 animate-pulse" />
                Working…
              </>
            ) : (
              <>
                <FilePlus className="h-4 w-4" />
                Upload &amp; Issue
              </>
            )}
          </Button>
        </div>

        {cid && (
          <p className="text-xs text-ink-500 dark:text-ink-400 font-mono break-all">
            IPFS CID: {cid}
          </p>
        )}
        {status && <Alert tone="info">{status}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
      </form>
    </Card>
  );
}

export default UploadCredential;
