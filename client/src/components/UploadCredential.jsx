import { useState } from "react";
import { uploadToIPFS } from "../utils/ipfs";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";

function UploadCredential() {
  const { isAdmin } = useWallet();
  const [studentAddress, setStudentAddress] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [cid, setCid] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // BUG-19: only admins can see this component
  if (!isAdmin) return null;

  const handleUploadAndStore = async () => {
    setError("");
    setStatus("");
    setCid("");

    // BUG-04: all validation runs before the IPFS upload
    if (!studentAddress.trim()) {
      setError("Please enter the student wallet address.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a credential title.");
      return;
    }
    if (!file) {
      setError("Please select a file.");
      return;
    }

    // BUG-05: wrapped in try/catch so every failure surfaces a readable message
    try {
      setStatus("Uploading to IPFS...");
      const ipfsCid = await uploadToIPFS(file);
      setCid(ipfsCid);

      setStatus("Storing credential hash on blockchain...");
      const contract = await getContract();
      const cidHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsCid));

      const tx = await contract.issueCredential(
        studentAddress.trim(),
        cidHash,
        ipfsCid,
        title.trim()
      );
      await tx.wait();

      setStatus("✅ Credential issued successfully!");
      setStudentAddress("");
      setTitle("");
      setFile(null);
    } catch (err) {
      setStatus("");
      setError(err.reason || err.message || "Transaction failed.");
    }
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h3>Issue Credential (Admin Only)</h3>

      {/* BUG-01: admin now specifies the target student address */}
      <input
        type="text"
        placeholder="Student Wallet Address (0x...)"
        value={studentAddress}
        onChange={(e) => setStudentAddress(e.target.value)}
        style={{ width: "420px", display: "block", marginBottom: "10px" }}
      />
      <input
        type="text"
        placeholder="Credential Title (e.g. BTech Semester 6)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "420px", display: "block", marginBottom: "10px" }}
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        style={{ display: "block", marginBottom: "10px" }}
      />
      <button onClick={handleUploadAndStore}>Upload & Issue Credential</button>

      {cid && <p>📌 IPFS CID: {cid}</p>}
      {status && <p style={{ color: "green" }}>{status}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default UploadCredential;
