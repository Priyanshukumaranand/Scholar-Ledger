import { useState } from "react";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";

function VerifyCredential() {
  const [studentAddress, setStudentAddress] = useState("");
  const [cid, setCid] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const verify = async () => {
    setResult("");
    setError("");

    // BUG-18: validate both inputs before making any contract call
    if (!studentAddress.trim()) {
      setError("Please enter the student wallet address.");
      return;
    }
    if (!cid.trim()) {
      setError("Please enter the IPFS CID.");
      return;
    }

    // BUG-06: wrapped in try/catch so errors surface instead of silently hanging
    try {
      const contract = await getContract();
      const cidHash = ethers.keccak256(ethers.toUtf8Bytes(cid.trim()));

      // BUG-02: uses the student address input, not the connected wallet
      const isValid = await contract.verifyCredential(
        studentAddress.trim(),
        cidHash
      );

      setResult(isValid ? "✅ Valid Credential" : "❌ Invalid or Revoked Credential");
    } catch (err) {
      setError(err.reason || err.message || "Verification failed.");
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
      <button onClick={verify}>Verify</button>

      {result && <p>{result}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default VerifyCredential;
