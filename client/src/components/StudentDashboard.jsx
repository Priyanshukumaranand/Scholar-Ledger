import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";
import { useWallet } from "../context/WalletContext";
import CredentialCard from "./CredentialCard";

function StudentDashboard() {
  const { account, isAdmin } = useWallet();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tracks which student's credentials are currently displayed.
  // Defaults to the connected wallet; admins can look up any address.
  const [viewedStudent, setViewedStudent] = useState("");
  const [studentInput, setStudentInput] = useState("");

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
          cid: cred[1],
          title: cred[2],
          issuedOn: new Date(Number(cred[3]) * 1000).toLocaleDateString(),
          revoked: cred[4],
          issuer: cred[5],
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
      <div style={{ marginTop: "20px" }}>
        <p>Connect your wallet to view credentials.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>Credential Dashboard</h2>

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
          <CredentialCard
            key={cred.index}
            credential={cred}
            studentAddress={viewedStudent}
            isAdmin={isAdmin}
            onRevoke={handleRevoke}
          />
        ))}
    </div>
  );
}

export default StudentDashboard;
