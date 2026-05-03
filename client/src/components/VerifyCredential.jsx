import { useState } from "react";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { ethers } from "ethers";

// Manual verification form. Uses the read-only provider so verifiers
// without MetaMask can still verify credentials.
function VerifyCredential() {
  const [studentAddress, setStudentAddress] = useState("");
  const [cid, setCid] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setResult("");
    setError("");

    if (!studentAddress.trim()) {
      setError("Please enter the student wallet address.");
      return;
    }
    if (!cid.trim()) {
      setError("Please enter the IPFS CID.");
      return;
    }

    setLoading(true);
    try {
      const contract = getReadOnlyContract();
      const cidHash = ethers.keccak256(ethers.toUtf8Bytes(cid.trim()));
      const isValid = await contract.verifyCredential(
        studentAddress.trim(),
        cidHash
      );
      setResult(
        isValid ? "✅ Valid Credential" : "❌ Invalid or Revoked Credential"
      );
    } catch (err) {
      setError(err.reason || err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Verify Credential</h3>

      <input
        type="text"
        placeholder="Student Wallet Address (0x...)"
        value={studentAddress}
        onChange={(e) => setStudentAddress(e.target.value)}
        style={{ display: "block", width: "420px", marginBottom: "10px" }}
      />
      <input
        type="text"
        placeholder="IPFS CID"
        value={cid}
        onChange={(e) => setCid(e.target.value)}
        style={{ display: "block", width: "420px", marginBottom: "10px" }}
      />
      <button onClick={verify} disabled={loading}>
        {loading ? "Verifying..." : "Verify"}
      </button>

      {result && <p>{result}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default VerifyCredential;
