import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getReadOnlyContract } from "../utils/readOnlyContract";

// Public student profile — shows every credential a wallet has been issued.
// No login, no wallet required. Read-only via JsonRpcProvider.
function PublicProfile() {
  const { address } = useParams();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const contract = getReadOnlyContract();
        const count = Number(await contract.getCredentialCount(address));
        const records = [];
        for (let i = 0; i < count; i++) {
          const cred = await contract.getCredential(address, i);
          records.push({
            index: i,
            cidHash: cred[0],
            cid: cred[1],
            title: cred[2],
            issuedOn: new Date(Number(cred[3]) * 1000).toLocaleDateString(),
            revoked: cred[4],
            issuer: cred[5],
          });
        }
        setCredentials(records);
      } catch (err) {
        setError(err.reason || err.message || "Could not load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [address]);

  const profileUrl = window.location.href;
  const copyProfile = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const active = credentials.filter((c) => !c.revoked);
  const revoked = credentials.filter((c) => c.revoked);

  return (
    <div style={{ maxWidth: "920px", margin: "0 auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #14285a 0%, #2a4a9c 100%)",
          color: "white",
          padding: "30px",
          borderRadius: "10px",
          marginBottom: "24px",
          display: "flex",
          gap: "20px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1 style={{ margin: 0 }}>Student Credential Profile</h1>
          <p style={{ margin: "8px 0 0 0", opacity: 0.85, wordBreak: "break-all" }}>
            {address}
          </p>
          <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={copyProfile}
              style={{
                background: "white",
                color: "#14285a",
                border: "none",
                padding: "8px 14px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {copied ? "Link Copied!" : "Copy Profile Link"}
            </button>
          </div>
        </div>
        <div style={{ background: "white", padding: "10px", borderRadius: "8px" }}>
          <QRCodeSVG value={profileUrl} size={110} level="M" />
        </div>
      </div>

      {loading && <p>Loading credentials from blockchain...</p>}
      {error && (
        <p style={{ color: "#b00020", padding: "12px", background: "#ffe6e6", borderRadius: "6px" }}>
          {error}
        </p>
      )}

      {!loading && !error && credentials.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <p>No credentials have been issued to this address yet.</p>
        </div>
      )}

      {!loading && !error && credentials.length > 0 && (
        <>
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <div
              style={{
                flex: 1,
                padding: "16px",
                background: "#e6ffe6",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0a7d24" }}>
                {active.length}
              </div>
              <div style={{ fontSize: "13px", color: "#555" }}>Active Credentials</div>
            </div>
            <div
              style={{
                flex: 1,
                padding: "16px",
                background: "#ffe6e6",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#b00020" }}>
                {revoked.length}
              </div>
              <div style={{ fontSize: "13px", color: "#555" }}>Revoked</div>
            </div>
            <div
              style={{
                flex: 1,
                padding: "16px",
                background: "#eef2ff",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#14285a" }}>
                {credentials.length}
              </div>
              <div style={{ fontSize: "13px", color: "#555" }}>Total Issued</div>
            </div>
          </div>

          <h2>Credentials</h2>
          {credentials.map((cred) => (
            <Link
              key={cred.index}
              to={`/verify/${address}/${cred.index}`}
              style={{
                display: "block",
                padding: "16px",
                marginBottom: "12px",
                background: cred.revoked ? "#ffe6e6" : "#e6ffe6",
                border: "1px solid #ccc",
                borderRadius: "8px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ margin: "0 0 6px 0" }}>{cred.title}</h3>
                  <p style={{ margin: "2px 0", fontSize: "13px" }}>
                    Issued On: {cred.issuedOn}
                  </p>
                  <p style={{ margin: "2px 0", fontSize: "13px" }}>
                    Issuer: {cred.issuer.slice(0, 6)}...{cred.issuer.slice(-4)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      background: cred.revoked ? "#b00020" : "#0a7d24",
                      color: "white",
                    }}
                  >
                    {cred.revoked ? "REVOKED" : "ACTIVE"}
                  </span>
                  <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#666" }}>
                    Click to verify →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </>
      )}
    </div>
  );
}

export default PublicProfile;
