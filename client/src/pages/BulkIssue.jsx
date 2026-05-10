import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  Upload,
  CheckCircle2,
  Wand2,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Search,
  Download,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { uploadToIPFS } from "../utils/ipfs";
import { getContract } from "../utils/contract";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { apiFetch } from "../utils/backend";
import { humanizeError } from "../utils/errors";
import useFormDraft from "../utils/useFormDraft";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import TitleCombobox from "../components/ui/TitleCombobox";
import { rememberTitle } from "../utils/credentialPresets";
import { notifyCredentialIssued, getNotifyEnabled } from "../utils/notify";
import useDocumentTitle from "../utils/useDocumentTitle";

const defaultTitle = (filename) =>
  filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

const newId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function BulkIssue() {
  useDocumentTitle("Bulk Issue");
  const { canIssue, account } = useWallet();
  const { pushToast } = useToast();

  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fillAddr, setFillAddr] = useState("");
  const [fillTitle, setFillTitle] = useState("");

  // Each row drives one credential in the batch. Persisted to localStorage so
  // accidental refreshes don't waste IPFS upload work.
  const [rows, setRows, clearRowsDraft] = useFormDraft(
    `bulk-issue:${account || "anon"}`,
    []
  );

  const [showCsv, setShowCsv] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvImporting, setCsvImporting] = useState(false);

  const [checkingPreflight, setCheckingPreflight] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [lastSubmitted, setLastSubmitted] = useState([]);
  const successRef = useRef(null);

  // Re-run preflight when the user fills in addresses (debounced).
  // Declared up here — must run unconditionally on every render before any
  // early `return`, per the rules of hooks.
  const preflightTimer = useRef(null);
  useEffect(() => {
    if (rows.length === 0) return;
    const needsCheck = rows.some(
      (r) =>
        r.alreadyIssued === null &&
        r.cid &&
        r.cidHash &&
        ethers.isAddress(r.student.trim())
    );
    if (!needsCheck) return;
    clearTimeout(preflightTimer.current);
    preflightTimer.current = setTimeout(() => {
      runPreflight();
    }, 600);
    return () => clearTimeout(preflightTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  // Preflight check: groups rows by student, fetches each student's existing
  // cidHashes from chain, marks rows whose (student, cidHash) is already issued.
  // Returns the updates Map so callers can synchronously act on the freshest
  // result without waiting for setRows to flush.
  const runPreflight = async (rowsToCheck = null) => {
    setCheckingPreflight(true);
    try {
      const target = rowsToCheck || rows;
      const byStudent = new Map();
      target.forEach((r) => {
        if (!r.cid || !r.cidHash || r.uploadError) return;
        const addr = r.student.trim();
        if (!ethers.isAddress(addr)) return;
        const key = addr.toLowerCase();
        if (!byStudent.has(key)) byStudent.set(key, { address: addr, ids: [] });
        byStudent.get(key).ids.push({ id: r.id, cidHash: r.cidHash });
      });

      if (byStudent.size === 0) {
        setCheckingPreflight(false);
        return new Map();
      }

      const sl = getReadOnlyContract("scholarLedger");
      const updates = new Map();

      for (const [, { address, ids }] of byStudent) {
        const count = Number(await sl.getCredentialCount(address));
        const creds = await Promise.all(
          Array.from({ length: count }, (_, i) => sl.getCredential(address, i))
        );
        const existing = new Set(creds.map((c) => String(c[0]).toLowerCase()));
        for (const { id, cidHash } of ids) {
          updates.set(id, existing.has(String(cidHash).toLowerCase()));
        }
      }

      setRows((rs) =>
        rs.map((r) =>
          updates.has(r.id) ? { ...r, alreadyIssued: updates.get(r.id) } : r
        )
      );
      return updates;
    } catch (err) {
      pushToast({
        tone: "danger",
        title: "On-chain check failed",
        message: humanizeError(err, "Could not reach the chain."),
      });
      return new Map();
    } finally {
      setCheckingPreflight(false);
    }
  };

  if (!canIssue) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <Alert tone="warning" title="Permission required">
            Only wallets with Issuer or Admin role can issue credentials.
          </Alert>
        </Card>
      </div>
    );
  }

  const onUploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setSubmitStatus("");
    setSubmitError("");

    const newRows = [];
    for (const f of files) {
      let cid = null;
      let cidHash = null;
      let uploadError = null;
      try {
        cid = await uploadToIPFS(f);
        cidHash = ethers.keccak256(ethers.toUtf8Bytes(cid));
      } catch (err) {
        uploadError = humanizeError(err, "IPFS upload failed");
      }
      newRows.push({
        id: newId(),
        source: "file",
        name: f.name,
        student: "",
        title: defaultTitle(f.name),
        cid,
        cidHash,
        uploadError,
        alreadyIssued: null,
      });
    }
    setRows((prev) => [...prev, ...newRows]);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    pushToast({
      tone: "success",
      title: "Files uploaded",
      message: `${newRows.filter((r) => r.cid).length} of ${newRows.length} pinned to IPFS. Fill in student addresses below.`,
    });
  };

  const onCsvParse = async (file) => {
    if (!file) return;
    setCsvError("");
    setCsvImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiFetch("/api/v1/bulk/parse-csv", {
        method: "POST",
        body: formData,
      });
      const imported = (result.items || []).map((it) => ({
        id: newId(),
        source: "csv",
        name: null,
        student: it.student,
        title: it.title,
        cid: it.cid,
        cidHash: it.cidHash,
        uploadError: null,
        alreadyIssued: null,
      }));
      setRows((prev) => [...prev, ...imported]);
      if (result.errors?.length > 0) {
        setCsvError(
          `Imported ${imported.length} rows. Skipped ${result.errors.length}: ` +
            result.errors
              .slice(0, 5)
              .map((e) => `line ${e.line} (${e.error})`)
              .join("; ") +
            (result.errors.length > 5 ? "…" : "")
        );
      }
      if (csvInputRef.current) csvInputRef.current.value = "";
      // Auto preflight: students from CSV are already known
      if (imported.length > 0) await runPreflight(imported);
    } catch (err) {
      setCsvError(humanizeError(err, "CSV parse failed"));
    } finally {
      setCsvImporting(false);
    }
  };

  const updateRow = (id, key, value) => {
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, [key]: value };
        // Invalidate preflight result if address or cid changed
        if (key === "student" || key === "cid" || key === "cidHash") {
          next.alreadyIssued = null;
        }
        return next;
      })
    );
  };

  const removeRow = (id) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const clearAll = () => {
    if (rows.length === 0) return;
    setConfirmClear(true);
  };

  const doClearAll = () => {
    setConfirmClear(false);
    setRows([]);
  };

  const fillSampleStudents = () => {
    const sample = fillAddr.trim();
    if (!sample || !ethers.isAddress(sample)) {
      pushToast({
        tone: "danger",
        message: "Enter a valid Ethereum address in the field first.",
      });
      return;
    }
    setRows((rs) =>
      rs.map((r) =>
        r.student.trim() ? r : { ...r, student: sample, alreadyIssued: null }
      )
    );
    setFillAddr("");
    pushToast({ tone: "success", message: "Empty rows filled." });
  };

  const applyTitleToAll = (mode) => {
    const t = fillTitle.trim();
    if (!t) {
      pushToast({ tone: "danger", message: "Pick or type a title first." });
      return;
    }
    setRows((rs) =>
      rs.map((r) => {
        if (mode === "empty" && r.title.trim()) return r;
        return { ...r, title: t };
      })
    );
    pushToast({
      tone: "success",
      message:
        mode === "all"
          ? "Title applied to every row."
          : "Title applied to empty rows.",
    });
  };

  const removeAllAlreadyIssued = () => {
    setRows((rs) => rs.filter((r) => r.alreadyIssued !== true));
    pushToast({ tone: "info", message: "Cleared already-issued rows." });
  };

  const rowState = (r) => {
    if (r.uploadError) return { ready: false, reason: "Upload failed" };
    if (!r.cid) return { ready: false, reason: "Missing CID" };
    if (!r.title.trim()) return { ready: false, reason: "Title required" };
    const addr = r.student.trim();
    if (!addr) return { ready: false, reason: "Address required" };
    if (!ethers.isAddress(addr))
      return { ready: false, reason: "Invalid address" };
    if (r.alreadyIssued === true)
      return { ready: false, reason: "Already issued" };
    return { ready: true, reason: "Ready" };
  };

  const validRows = rows.filter((r) => rowState(r).ready);

  // In-batch duplicate detection
  const duplicates = new Set();
  const seen = new Set();
  validRows.forEach((r) => {
    const key = `${r.student.trim().toLowerCase()}|${r.cidHash}`;
    if (seen.has(key)) duplicates.add(r.id);
    else seen.add(key);
  });

  const onSubmit = async () => {
    if (validRows.length === 0) return;

    if (duplicates.size > 0) {
      setSubmitError(
        "Batch contains duplicate (student, CID) pairs. Resolve before submitting."
      );
      return;
    }

    // Final pre-flight before sending the tx — use the returned updates
    // map directly rather than waiting on a re-rendered `rows` snapshot.
    setSubmitStatus("Running on-chain duplicate check…");
    const updates = (await runPreflight()) || new Map();
    const projected = rows.map((r) =>
      updates.has(r.id) ? { ...r, alreadyIssued: updates.get(r.id) } : r
    );
    const stillValid = projected.filter((r) => rowState(r).ready);
    if (stillValid.length < validRows.length) {
      setSubmitStatus("");
      pushToast({
        tone: "danger",
        title: "Duplicates detected",
        message:
          "Some rows are already issued. Remove them before submitting.",
      });
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitStatus("Awaiting wallet confirmation…");
    setTxHash("");
    try {
      const students = stillValid.map((r) => r.student.trim());
      const cidHashes = stillValid.map((r) => r.cidHash);
      const cids = stillValid.map((r) => r.cid);
      const titles = stillValid.map((r) => r.title.trim());

      const contract = await getContract("scholarLedger");
      const tx = await contract.issueCredentialBatch(
        students,
        cidHashes,
        cids,
        titles
      );
      setTxHash(tx.hash);
      setSubmitStatus("Mining transaction…");
      const receipt = await tx.wait();

      const issuedSnapshot = stillValid.map((r) => ({
        student: r.student.trim(),
        title: r.title.trim(),
        cid: r.cid,
      }));
      const uniqueTitles = Array.from(
        new Set(issuedSnapshot.map((r) => r.title).filter(Boolean))
      );
      uniqueTitles.forEach((t) => rememberTitle(account, t));
      setLastSubmitted(issuedSnapshot);
      setSubmitStatus("");

      // Best-effort email notifications. Parse logs to map student -> index.
      if (getNotifyEnabled()) {
        const issuedEvents = (receipt?.logs || [])
          .map((l) => {
            try {
              return contract.interface.parseLog(l);
            } catch {
              return null;
            }
          })
          .filter((p) => p?.name === "CredentialIssued");
        let sent = 0;
        await Promise.all(
          issuedEvents.map(async (parsed) => {
            const student = parsed.args?.student;
            const index = Number(parsed.args?.index ?? -1);
            const title = parsed.args?.title || "";
            if (!student || index < 0) return;
            const result = await notifyCredentialIssued({
              student,
              index,
              title,
              issuerAddress: account,
            });
            if (result?.ok) sent += 1;
          })
        );
        if (sent > 0) {
          pushToast({
            tone: "info",
            title: "Emails sent",
            message: `${sent} student${sent === 1 ? "" : "s"} notified by email.`,
          });
        }
      }

      const submittedIds = new Set(stillValid.map((r) => r.id));
      setRows((rs) => rs.filter((r) => !submittedIds.has(r.id)));
      clearRowsDraft();

      pushToast({
        tone: "success",
        title: "Batch issued",
        message: `${stillValid.length} credential${
          stillValid.length === 1 ? "" : "s"
        } anchored on-chain.`,
        duration: 6000,
      });

      setTimeout(() => {
        successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setSubmitStatus("");
      setSubmitError(humanizeError(err, "Batch issuance failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const total = rows.length;
  const ready = validRows.length;
  const notReady = total - ready;
  const alreadyIssuedCount = rows.filter((r) => r.alreadyIssued === true).length;

  const downloadVerificationCsv = () => {
    if (lastSubmitted.length === 0) return;
    const safe = (s) => String(s).replace(/[",\n\r]+/g, " ").trim();
    const lines = ["student,title,cid"];
    lastSubmitted.forEach((r) =>
      lines.push([safe(r.student), safe(r.title), safe(r.cid)].join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scholar-ledger-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title="Bulk Issue Credentials"
          subtitle="Upload many documents to IPFS, fill in student addresses inline, and issue them in a single atomic transaction."
        />
        <Alert tone="info">
          <strong>How it works:</strong> Step 1 — upload all files, IPFS returns
          a CID for each. Step 2 — fill in the student wallet address for each
          row. Each row is then automatically checked against the chain to
          prevent duplicate issuance. Step 3 — submit the batch (up to 500
          credentials per transaction).
        </Alert>
      </Card>

      {/* Step 1 */}
      <Card>
        <CardHeader
          title="Step 1 — Upload Documents to IPFS"
          subtitle="Pick all credential files at once. Each is pinned to IPFS and added as a pending row in the table below."
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files))}
          className="block w-full text-sm text-ink-600 dark:text-ink-300
                   file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2
                   file:text-sm file:font-medium file:text-white hover:file:bg-brand-700
                   file:cursor-pointer cursor-pointer"
        />
        {files.length > 0 && (
          <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
            {files.length} file(s) selected
          </p>
        )}
        <div className="mt-3">
          <Button onClick={onUploadFiles} disabled={files.length === 0 || uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : `Upload ${files.length || ""} to IPFS`}
          </Button>
        </div>
      </Card>

      {/* Empty state — shown only when nothing has been added yet */}
      {rows.length === 0 && !uploading && (
        <EmptyState
          icon={FileSpreadsheet}
          title="No pending rows yet"
          description="Pick documents above to upload — or import a CSV with student, title, cid columns. Your work is auto-saved if you refresh."
        />
      )}

      {/* Step 2 */}
      {rows.length > 0 && (
        <Card>
          <CardHeader
            title={`Step 2 — Review & Fill in Student Addresses (${total} row${
              total === 1 ? "" : "s"
            })`}
            subtitle="Type each student's wallet address. Rows are auto-checked against the chain to prevent duplicate issuance."
            actions={
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  value={fillAddr}
                  onChange={(e) => setFillAddr(e.target.value)}
                  placeholder="0x… for empty rows"
                  className="input font-mono text-xs h-8 w-[220px]"
                />
                <Button size="sm" variant="secondary" onClick={fillSampleStudents}>
                  <Wand2 className="h-3.5 w-3.5" />
                  Fill empty
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => runPreflight()}
                  disabled={checkingPreflight}
                >
                  <Search className="h-3.5 w-3.5" />
                  {checkingPreflight ? "Checking…" : "Re-check on-chain"}
                </Button>
                <Button size="sm" variant="ghost" onClick={clearAll}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all
                </Button>
              </div>
            }
          />

          <div className="mb-4 rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/40 p-3">
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex-1 min-w-[260px]">
                <TitleCombobox
                  label="Apply title to rows"
                  placeholder="Pick a preset or type a title…"
                  value={fillTitle}
                  onChange={setFillTitle}
                  issuerAddr={account}
                />
              </div>
              <Button size="sm" variant="secondary" onClick={() => applyTitleToAll("empty")}>
                <Wand2 className="h-3.5 w-3.5" />
                Fill empty
              </Button>
              <Button size="sm" variant="ghost" onClick={() => applyTitleToAll("all")}>
                Apply to all
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-ink-500 dark:text-ink-400">
              Use this when most rows share a title (e.g. "Bachelor of Science"). You can still tweak each row individually below.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap mb-3">
            <Badge tone="success">Ready: {ready}</Badge>
            {notReady > 0 && (
              <Badge tone="warning">Needs attention: {notReady}</Badge>
            )}
            {alreadyIssuedCount > 0 && (
              <Badge tone="danger">Already issued: {alreadyIssuedCount}</Badge>
            )}
            {duplicates.size > 0 && (
              <Badge tone="danger">In-batch duplicates: {duplicates.size}</Badge>
            )}
            {alreadyIssuedCount > 0 && (
              <button
                className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                onClick={removeAllAlreadyIssued}
              >
                Remove all already-issued rows
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-md border border-ink-200 dark:border-ink-800">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">
                <tr className="text-left">
                  <th className="py-2.5 px-3 font-medium">Source</th>
                  <th className="py-2.5 px-3 font-medium w-[260px]">
                    Student Address ★
                  </th>
                  <th className="py-2.5 px-3 font-medium">Title ★</th>
                  <th className="py-2.5 px-3 font-medium">CID</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const state = rowState(r);
                  const isDup = duplicates.has(r.id);
                  const rowBg =
                    r.alreadyIssued === true || isDup
                      ? "bg-red-50/50 dark:bg-red-950/20"
                      : "";
                  return (
                    <tr
                      key={r.id}
                      className={`border-t border-ink-100 dark:border-ink-800 ${rowBg}`}
                    >
                      <td className="py-2 px-3 align-top">
                        {r.source === "file" ? (
                          <span className="text-xs font-mono">{r.name}</span>
                        ) : (
                          <Badge tone="neutral">CSV</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 align-top">
                        <input
                          value={r.student}
                          onChange={(e) =>
                            updateRow(r.id, "student", e.target.value)
                          }
                          placeholder="0x…"
                          className="input font-mono text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 align-top">
                        <input
                          value={r.title}
                          onChange={(e) =>
                            updateRow(r.id, "title", e.target.value)
                          }
                          className="input text-sm"
                        />
                      </td>
                      <td className="py-2 px-3 align-top">
                        {r.cid ? (
                          <code className="text-[11px] font-mono break-all text-ink-500 dark:text-ink-400">
                            {r.cid.slice(0, 14)}…
                          </code>
                        ) : (
                          <span className="text-xs text-red-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 align-top">
                        {r.alreadyIssued === true ? (
                          <Badge tone="danger">Already issued</Badge>
                        ) : isDup ? (
                          <Badge tone="danger">Duplicate in batch</Badge>
                        ) : state.ready ? (
                          <Badge tone="success">Ready</Badge>
                        ) : (
                          <Badge tone="warning">{state.reason}</Badge>
                        )}
                        {checkingPreflight &&
                          r.alreadyIssued === null &&
                          state.ready === false &&
                          state.reason !== "Address required" &&
                          state.reason !== "Invalid address" && (
                            <span className="ml-2 text-[11px] text-ink-400">
                              checking…
                            </span>
                          )}
                      </td>
                      <td className="py-2 px-3 align-top text-right">
                        <button
                          onClick={() => removeRow(r.id)}
                          aria-label="Remove row"
                          className="text-ink-400 hover:text-red-600 px-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CSV import (optional) */}
      <Card>
        <CardHeader
          title="Optional — Import from CSV"
          subtitle="If you already have a CSV with student/title/cid columns, import it instead of uploading individual files."
          actions={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCsv((s) => !s)}
            >
              {showCsv ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> Show
                </>
              )}
            </Button>
          }
        />
        {showCsv && (
          <div className="space-y-3">
            <Alert tone="info">
              CSV header must be exactly{" "}
              <code className="font-mono">student,title,cid</code>. The CIDs
              must already exist on IPFS.
            </Alert>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => onCsvParse(e.target.files[0])}
              className="block w-full text-sm text-ink-600 dark:text-ink-300
                       file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2
                       file:text-sm file:font-medium file:text-white hover:file:bg-brand-700
                       file:cursor-pointer cursor-pointer"
            />
            {csvImporting && (
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Parsing CSV via backend…
              </p>
            )}
            {csvError && <Alert tone="danger">{csvError}</Alert>}
          </div>
        )}
      </Card>

      {/* Step 3 — submit */}
      {ready > 0 && (
        <Card>
          <CardHeader
            title={`Step 3 — Submit Batch (${ready} credential${ready === 1 ? "" : "s"})`}
            subtitle="Single atomic transaction. Either every credential is issued or the entire batch reverts."
          />
          <Button
            onClick={onSubmit}
            disabled={submitting || duplicates.size > 0 || alreadyIssuedCount > 0}
            size="lg"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting…" : `Issue Batch (${ready})`}
          </Button>
          {submitStatus && (
            <div className="mt-3">
              <Alert tone="info">{submitStatus}</Alert>
            </div>
          )}
          {txHash && (
            <p className="mt-2 text-xs text-ink-500 dark:text-ink-400 font-mono break-all">
              Tx: {txHash}
            </p>
          )}
          {submitError && (
            <div className="mt-3">
              <Alert tone="danger">{submitError}</Alert>
            </div>
          )}
        </Card>
      )}

      {/* Success panel — prominent confirmation after batch issuance */}
      {lastSubmitted.length > 0 && (
        <div ref={successRef} className="animate-fade-in">
          <Card className="border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-ink-900">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-[260px]">
                <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                  Batch issued successfully
                </h2>
                <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80">
                  {lastSubmitted.length} credential
                  {lastSubmitted.length === 1 ? " is" : "s are"} now anchored
                  on-chain. Verifiers can independently confirm authenticity at
                  any time.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={downloadVerificationCsv}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Verification CSV
                  </Button>
                  <Link to="/bulk-verify">
                    <Button size="sm" variant="primary">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verify on-chain
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-md border border-emerald-200 dark:border-emerald-900/50">
              <table className="w-full text-xs">
                <thead className="bg-white/60 dark:bg-ink-900/60 text-ink-600 dark:text-ink-400">
                  <tr className="text-left">
                    <th className="py-2 px-3 font-medium">Student</th>
                    <th className="py-2 px-3 font-medium">Title</th>
                    <th className="py-2 px-3 font-medium">CID</th>
                  </tr>
                </thead>
                <tbody>
                  {lastSubmitted.map((r, i) => (
                    <tr
                      key={i}
                      className="border-t border-emerald-200/60 dark:border-emerald-900/40"
                    >
                      <td className="py-2 px-3 font-mono text-[11px]">
                        {r.student.slice(0, 10)}…{r.student.slice(-4)}
                      </td>
                      <td className="py-2 px-3">{r.title}</td>
                      <td className="py-2 px-3 font-mono text-[11px]">
                        {r.cid.slice(0, 14)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={doClearAll}
        title="Clear all pending rows?"
        message="Any IPFS uploads stay pinned but will not be issued on-chain. You can re-add them later."
        confirmLabel="Clear rows"
        tone="warning"
      />
    </div>
  );
}

export default BulkIssue;

