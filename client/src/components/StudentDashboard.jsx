import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";
import { useWallet } from "../context/WalletContext";

function StudentDashboard() {
  // BUG-10: single useWallet() call replaces the two separate getContract()+eth_requestAccounts
  //         calls that previously fired on every mount
  const { account, isAdmin } = useWallet();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // BUG-03: tracks which student's credentials are currently displayed
  //         so the revoke call always passes the correct address
  const [viewedStudent, setViewedStudent] = useState("");
  const [studentInput, setStudentInput] = useState("");

  // BUG-09: dashboard only loads once the user has actively connected —
  //         no MetaMask popup fires on page load
  useEffect(() => {
    if (!account) return;
    setViewedStudent(account);
  }, [account]);

  useEffect(() => {
    if (!viewedStudent) return;
    loadCredentials(viewedStudent);
  }, [viewedStudent]);

  const loadCredentials = async (studentAddress) => {
    setLoading(true);
    setError("");
    try {
      const contract = await getContract();
      const count = await contract.getCredentialCount(studentAddress);
      const records = [];

      for (let i = 0; i < Number(count); i++) {
        const cred = await contract.getCredential(studentAddress, i);
        records.push({
          index: i,
          cidHash: cred[0],
          title: cred[1],
          issuedOn: new Date(Number(cred[2]) * 1000).toLocaleDateString(),
          revoked: cred[3],
          issuer: cred[4],
        });
      }

      setCredentials(records);
    } catch (err) {
      setError(err.reason || err.message || "Failed to load credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = () => {
    const addr = studentInput.trim();
    if (!addr) return;
    setViewedStudent(addr);
  };

  const handleViewOwn = () => {
    setStudentInput("");
    setViewedStudent(account);
  };

  const handleRevoke = async (studentAddress, index) => {
    try {
      const contract = await getContract();
      const tx = await contract.revokeCredential(studentAddress, index);
      await tx.wait();
      alert("Credential revoked successfully.");
      loadCredentials(studentAddress);
    } catch (err) {
      alert(err.reason || err.message || "Revoke failed.");
    }
  };

  if (!account) {
    return (
      <div style={{ marginTop: "40px" }}>
        <p>Connect your wallet to view credentials.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Credential Dashboard</h2>

      {/* BUG-03: admin can look up any student's credentials by address */}
      {isAdmin && (
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Enter student wallet address to view"
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            style={{ width: "420px", marginRight: "8px" }}
          />
          <button onClick={handleLookup}>View Student</button>
          <button onClick={handleViewOwn} style={{ marginLeft: "8px" }}>
            View My Credentials
          </button>
        </div>
      )}

      {viewedStudent && (
        <p style={{ fontSize: "13px", color: "#555", marginBottom: "12px" }}>
          Showing credentials for: {viewedStudent}
        </p>
      )}

      {loading && <p>Loading credentials...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && credentials.length === 0 && (
        <p>No credentials issued yet.</p>
      )}

      {!loading && credentials.length > 0 && (
        <p style={{ fontWeight: "bold", marginBottom: "20px" }}>
          Total Credentials: {credentials.length}
        </p>
      )}

      {!loading &&
        credentials.map((cred) => (
          <div
            key={cred.index}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "6px",
              backgroundColor: cred.revoked ? "#ffe6e6" : "#e6ffe6",
            }}
          >
            <h4>{cred.title}</h4>
            <p>Issued On: {cred.issuedOn}</p>
            <p>
              Status: <strong>{cred.revoked ? "Revoked" : "Active"}</strong>
            </p>
            <p>
              Issuer: {cred.issuer.slice(0, 6)}...{cred.issuer.slice(-4)}
            </p>
            <p>
              CID Hash: {cred.cidHash.slice(0, 10)}...{cred.cidHash.slice(-6)}
            </p>

            {/* BUG-03: passes viewedStudent (the looked-up address), not the admin's own wallet */}
            {isAdmin && !cred.revoked && (
              <button
                onClick={() => handleRevoke(viewedStudent, cred.index)}
                style={{
                  marginTop: "10px",
                  padding: "6px 12px",
                  backgroundColor: "#ff4d4d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Revoke Credential
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

export default StudentDashboard;
