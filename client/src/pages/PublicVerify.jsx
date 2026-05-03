import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getReadOnlyContract } from "../utils/readOnlyContract";

// Public credential verification — no wallet required.
// Reads the credential at the given (address, index) directly via JsonRpcProvider.
function PublicVerify() {
  const { address, index } = useParams();
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const contract = getReadOnlyContract();
        const count = await contract.getCredentialCount(address);
        const total = Number(count);
        const idx = Number(index);

        if (Number.isNaN(idx) || idx < 0 || idx >= total) {
          setError("Credential not found for this student.");
          return;
        }

        const cred = await contract.getCredential(address, idx);
        setCredential({
          index: idx,
          cidHash: cred[0],
          cid: cred[1],
          title: cred[2],
          issuedOn: new Date(Number(cred[3]) * 1000).toLocaleDateString(),
          revoked: cred[4],
          issuer: cred[5],
        });
      } catch (err) {
        setError(
          err.reason || err.message || "Could not reach the network."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [address, index]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p>Verifying credential on-chain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "60px auto",
          padding: "30px",
          background: "#ffe6e6",
          border: "1px solid #b00020",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#b00020" }}>❌ Verification Failed</h2>
        <p>{error}</p>
        <p style={{ fontSize: "13px", color: "#555" }}>
          Student: {address}
          <br />
          Index: {index}
        </p>
      </div>
    );
  }

  const isValid = credential && !credential.revoked;
  const statusColor = isValid ? "#0a7d24" : "#b00020";
  const statusBg = isValid ? "#e6ffe6" : "#ffe6e6";
  const statusEmoji = isValid ? "✅" : "❌";
  const statusText = isValid ? "VALID CREDENTIAL" : "REVOKED CREDENTIAL";

  const verifyUrl = window.location.href;

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "30px auto",
        padding: "30px",
        background: statusBg,
        border: `2px solid ${statusColor}`,
        borderRadius: "10px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "26px" }}>
        <div style={{ fontSize: "42px", marginBottom: "8px" }}>{statusEmoji}</div>
        <h1 style={{ color: statusColor, margin: 0 }}>{statusText}</h1>
        <p style={{ color: "#555", marginTop: "8px" }}>
          This credential was independently verified against the blockchain.
        </p>
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#14285a" }}>{credential.title}</h2>

        <table style={{ width: "100%", fontSize: "14px", lineHeight: "1.8" }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: "bold", width: "160px", verticalAlign: "top" }}>
                Issued To:
              </td>
              <td style={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                {address}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", verticalAlign: "top" }}>
                Issued On:
              </td>
              <td>{credential.issuedOn}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", verticalAlign: "top" }}>
                Issuer Address:
              </td>
              <td style={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                {credential.issuer}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", verticalAlign: "top" }}>
                Status:
              </td>
              <td>
                <strong style={{ color: statusColor }}>
                  {credential.revoked ? "REVOKED" : "ACTIVE"}
                </strong>
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", verticalAlign: "top" }}>
                IPFS CID:
              </td>
              <td
                style={{
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              >
                {credential.cid}
                {credential.cid && (
                  <>
                    {" "}
                    <a
                      href={`${
                        process.env.REACT_APP_IPFS_GATEWAY ||
                        "https://ipfs.io/ipfs/"
                      }${credential.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "sans-serif", fontSize: "12px" }}
                    >
                      View Document →
                    </a>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", verticalAlign: "top" }}>
                CID Hash:
              </td>
              <td
                style={{
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              >
                {credential.cidHash}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          background: "white",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <QRCodeSVG value={verifyUrl} size={120} level="M" />
          <p style={{ fontSize: "11px", color: "#555", marginTop: "6px" }}>
            Share this QR
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "13px" }}>
            <Link to={`/profile/${address}`}>
              View student's full credential profile →
            </Link>
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
            Anyone with this link can independently verify the credential —
            no account or wallet needed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicVerify;
