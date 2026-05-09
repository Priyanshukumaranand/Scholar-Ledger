import { useState } from "react";
import { ethers } from "ethers";
import {
  ShieldCheck,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { apiFetch, isBackendConfigured } from "../utils/backend";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import useDocumentTitle from "../utils/useDocumentTitle";

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2)
    return { error: "CSV must have a header and at least one row." };
  const header = lines[0].split(",").map((c) => c.trim().toLowerCase());
  const studentIdx = header.indexOf("student");
  const indexIdx = header.indexOf("index");
  const cidHashIdx = header.indexOf("cidhash");
  const cidIdx = header.indexOf("cid");
  if (studentIdx === -1)
    return { error: "Header must include a 'student' column." };
  if (indexIdx === -1 && cidHashIdx === -1 && cidIdx === -1)
    return { error: "Header must include one of: index, cidHash, cid." };

  const items = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const student = cells[studentIdx];
    if (!ethers.isAddress(student)) {
      errors.push({ line: i + 1, error: "Invalid student address" });
      continue;
    }
    const item = { student };
    if (indexIdx !== -1 && cells[indexIdx]) {
      item.index = Number(cells[indexIdx]);
    } else if (cidHashIdx !== -1 && cells[cidHashIdx]) {
      item.cidHash = cells[cidHashIdx];
    } else if (cidIdx !== -1 && cells[cidIdx]) {
      item.cidHash = ethers.keccak256(ethers.toUtf8Bytes(cells[cidIdx]));
    } else {
      errors.push({ line: i + 1, error: "Row missing index/cidHash/cid" });
      continue;
    }
    items.push(item);
  }
  return { items, errors };
}

function BulkVerify() {
  useDocumentTitle("Bulk Verify");
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [results, setResults] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  // Helper to generate CSV from a student address
  const [generateAddr, setGenerateAddr] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generateInfo, setGenerateInfo] = useState("");

  const onGenerateCsv = async (e) => {
    e?.preventDefault?.();
    setGenerateError("");
    setGenerateInfo("");
    const addr = generateAddr.trim();
    if (!ethers.isAddress(addr)) {
      setGenerateError("Enter a valid wallet address (0x…)");
      return;
    }
    setGenerating(true);
    try {
      const sl = getReadOnlyContract("scholarLedger");
      const count = Number(await sl.getCredentialCount(addr));
      if (count === 0) {
        setGenerateError("This address has no credentials issued.");
        return;
      }
      const safe = (s) => String(s).replace(/[",\n\r]+/g, " ").trim();
      const lines = ["student,index,title,cid"];
      for (let i = 0; i < count; i++) {
        const c = await sl.getCredential(addr, i);
        lines.push([addr, i, safe(c[2]), safe(c[1])].join(","));
      }
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `credentials-${addr.slice(0, 8)}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerateInfo(
        `Downloaded CSV with ${count} credential${
          count === 1 ? "" : "s"
        }. Drop it in the upload field below to verify.`
      );
    } catch (err) {
      setGenerateError(err.reason || err.message || "Failed to generate CSV.");
    } finally {
      setGenerating(false);
    }
  };

  const onCsv = async (file) => {
    setError("");
    setItems([]);
    setErrors([]);
    setResults(null);
    if (!file) return;
    setParsing(true);
    try {
      const text = await file.text();
      const { items: parsedItems, errors: parsedErrors, error: parseError } =
        parseCsv(text);
      if (parseError) {
        setError(parseError);
        return;
      }
      setItems(parsedItems);
      setErrors(parsedErrors);
    } catch (err) {
      setError(err.message || "Failed to parse CSV");
    } finally {
      setParsing(false);
    }
  };

  const onVerify = async () => {
    if (items.length === 0) return;
    setVerifying(true);
    setError("");
    setResults(null);
    try {
      const result = await apiFetch("/api/v1/verify/bulk", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      setResults(result.results || []);
    } catch (err) {
      setError(err.message || "Verification request failed");
    } finally {
      setVerifying(false);
    }
  };

  const exportResults = () => {
    if (!results) return;
    const lines = ["row,student,index_or_hash,valid,revoked,title,issuer,error"];
    results.forEach((r, i) => {
      const ref = r.index !== undefined ? `index:${r.index}` : r.cidHash || "";
      lines.push(
        [
          i + 1,
          r.student || "",
          ref,
          r.valid ?? "",
          r.revoked ?? "",
          r.title || "",
          r.issuer || "",
          r.error || "",
        ]
          .map((v) => String(v).replace(/[,\n]/g, " "))
          .join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-verification-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const valid = results?.filter((r) => r.valid === true).length || 0;
  const invalid = results?.filter((r) => r.valid === false).length || 0;
  const errored = results?.filter((r) => r.error).length || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader
          eyebrow="Verifier"
          title="Bulk Credential Verification"
          subtitle="Upload a CSV of credentials to verify many at once. No wallet required."
        />
        {!isBackendConfigured && (
          <Alert tone="warning">Backend is not reachable.</Alert>
        )}
        <Alert tone="info" title="CSV format">
          Header row must include <code className="font-mono">student</code> plus
          one of <code className="font-mono">index</code>,{" "}
          <code className="font-mono">cidHash</code>, or{" "}
          <code className="font-mono">cid</code>.
        </Alert>
      </Card>

      {/* Helper: generate CSV from a student */}
      <Card>
        <CardHeader
          title="Don't have a CSV?"
          subtitle="Generate one by fetching every credential a student has on-chain."
        />
        <form onSubmit={onGenerateCsv} className="flex flex-wrap gap-2 items-end">
          <Input
            label="Student Wallet Address"
            placeholder="0x…"
            value={generateAddr}
            onChange={(e) => setGenerateAddr(e.target.value)}
            className="flex-1 min-w-[280px]"
          />
          <Button type="submit" variant="secondary" disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate CSV
              </>
            )}
          </Button>
        </form>
        {generateInfo && (
          <div className="mt-3">
            <Alert tone="success">{generateInfo}</Alert>
          </div>
        )}
        {generateError && (
          <div className="mt-3">
            <Alert tone="danger">{generateError}</Alert>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Upload CSV" />
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onCsv(e.target.files[0])}
          className="block w-full text-sm text-ink-600 dark:text-ink-300 cursor-pointer"
        />
        {parsing && (
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing…
          </p>
        )}
        {error && (
          <div className="mt-3">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        {(items.length > 0 || errors.length > 0) && (
          <div className="mt-5 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge tone="success">Valid: {items.length}</Badge>
              {errors.length > 0 && (
                <Badge tone="danger">Invalid: {errors.length}</Badge>
              )}
            </div>
            {errors.length > 0 && (
              <Alert tone="danger" title="Skipped rows">
                <ul className="list-disc pl-5 mt-1 text-xs">
                  {errors.map((e, i) => (
                    <li key={i}>
                      Line {e.line}: {e.error}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
            <Button
              onClick={onVerify}
              disabled={items.length === 0 || verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Verify {items.length} credential{items.length === 1 ? "" : "s"}
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {results && (
        <Card>
          <CardHeader
            title="Results"
            subtitle={`${valid} valid · ${invalid} invalid · ${errored} errored`}
            actions={
              <Button size="sm" variant="secondary" onClick={exportResults}>
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            }
          />

          <div className="overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-800">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">
                <tr className="text-left">
                  <th className="py-2.5 px-3 font-medium">#</th>
                  <th className="py-2.5 px-3 font-medium">Student</th>
                  <th className="py-2.5 px-3 font-medium">Ref</th>
                  <th className="py-2.5 px-3 font-medium">Title</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-ink-100 dark:border-ink-800"
                  >
                    <td className="py-2 px-3 text-ink-500 dark:text-ink-400">
                      {i + 1}
                    </td>
                    <td className="py-2 px-3 font-mono text-xs">
                      {r.student
                        ? r.student.slice(0, 8) + "…" + r.student.slice(-4)
                        : "—"}
                    </td>
                    <td className="py-2 px-3 font-mono text-xs">
                      {r.index !== undefined
                        ? `#${r.index}`
                        : (r.cidHash || "").slice(0, 14) + "…"}
                    </td>
                    <td className="py-2 px-3">{r.title || "—"}</td>
                    <td className="py-2 px-3">
                      {r.error ? (
                        <Badge tone="warning" title={r.error}>
                          <AlertTriangle className="h-3 w-3" />
                          Error
                        </Badge>
                      ) : r.valid ? (
                        <Badge tone="success">
                          <CheckCircle2 className="h-3 w-3" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge tone="danger">
                          <XCircle className="h-3 w-3" />
                          {r.revoked ? "Revoked" : "Invalid"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default BulkVerify;
