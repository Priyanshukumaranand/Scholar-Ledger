import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateCredentialPDF } from "../utils/pdfGenerator";

const IPFS_GATEWAY =
  process.env.REACT_APP_IPFS_GATEWAY || "https://ipfs.io/ipfs/";

// Reusable display for a single credential.
// - Shows full metadata including the live IPFS CID and a link to view the doc
// - QR code encoding the public verification URL
// - Buttons: download PDF, copy verification link, optional revoke
function CredentialCard({ credential, studentAddress, isAdmin, onRevoke }) {
  const [copied, setCopied] = useState("");
  const [generating, setGenerating] = useState(false);

  const verifyUrl = `${window.location.origin}/verify/${studentAddress}/${credential.index}`;
  const ipfsUrl = credential.cid ? `${IPFS_GATEWAY}${credential.cid}` : null;

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("Copy failed");
      setTimeout(() => setCopied(""), 1800);
    }
  };

  const downloadPDF = async () => {
    setGenerating(true);
    try {
      await generateCredentialPDF({
        studentAddress,
        cidHash: credential.cidHash,
        cid: credential.cid,
        title: credential.title,
        issuedOn: credential.issuedOn,
        revoked: credential.revoked,
        issuer: credential.issuer,
        verifyUrl,
        ipfsUrl,
      });
    } catch (err) {
      alert("PDF generation failed: " + (err.message || "unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "18px",
        marginBottom: "16px",
        borderRadius: "8px",
        backgroundColor: credential.revoked ? "#ffe6e6" : "#e6ffe6",
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 320px", minWidth: 0 }}>
        <h4 style={{ margin: "0 0 10px 0" }}>{credential.title}</h4>
        <p style={{ margin: "4px 0" }}>
          <strong>Issued On:</strong> {credential.issuedOn}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Status:</strong>{" "}
          <span
            style={{
              color: credential.revoked ? "#b00020" : "#0a7d24",
              fontWeight: "bold",
            }}
          >
            {credential.revoked ? "Revoked" : "Active"}
          </span>
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Issuer:</strong> {credential.issuer.slice(0, 6)}...
          {credential.issuer.slice(-4)}
        </p>

        {credential.cid && (
          <p style={{ margin: "4px 0", wordBreak: "break-all", fontSize: "12px" }}>
            <strong>IPFS CID:</strong> {credential.cid}{" "}
            <a
              href={ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "12px" }}
            >
              View Document →
            </a>
          </p>
        )}

        <p style={{ margin: "4px 0", wordBreak: "break-all", fontSize: "12px" }}>
          <strong>CID Hash:</strong> {credential.cidHash}
        </p>

        <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={downloadPDF} disabled={generating}>
            {generating ? "Generating..." : "Download PDF"}
          </button>
          <button onClick={() => copyToClipboard(verifyUrl, "verify")}>
            {copied === "verify" ? "Copied!" : "Copy Verification Link"}
          </button>
          {isAdmin && !credential.revoked && (
            <button
              onClick={() => onRevoke(studentAddress, credential.index)}
              style={{
                backgroundColor: "#ff4d4d",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Revoke
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: "0 0 auto", textAlign: "center" }}>
        <div
          style={{
            background: "white",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
        >
          <QRCodeSVG value={verifyUrl} size={110} level="M" />
        </div>
        <p style={{ fontSize: "11px", color: "#555", marginTop: "6px" }}>
          Scan to verify
        </p>
      </div>
    </div>
  );
}

export default CredentialCard;
