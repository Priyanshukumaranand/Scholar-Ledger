import { useState } from "react";
import { ethers } from "ethers";
import { ShieldCheck, Loader2 } from "lucide-react";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { humanizeError } from "../utils/errors";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Alert from "./ui/Alert";

function VerifyCredential() {
  const [studentAddress, setStudentAddress] = useState("");
  const [cid, setCid] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async (e) => {
    e?.preventDefault?.();
    setResult(null);
    setError("");

    const addr = studentAddress.trim();
    const cidIn = cid.trim();

    if (!ethers.isAddress(addr)) {
      setError("Enter a valid student wallet address (0x…)");
      return;
    }
    if (!cidIn) {
      setError("Enter the IPFS CID");
      return;
    }

    setLoading(true);
    try {
      const contract = getReadOnlyContract("scholarLedger");
      const cidHash = ethers.keccak256(ethers.toUtf8Bytes(cidIn));
      const isValid = await contract.verifyCredential(addr, cidHash);
      setResult(isValid);
    } catch (err) {
      setError(humanizeError(err, "Verification failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={verify} className="space-y-4">
      <Input
        label="Student Wallet Address"
        placeholder="0x…"
        value={studentAddress}
        onChange={(e) => setStudentAddress(e.target.value)}
      />
      <Input
        label="IPFS CID"
        placeholder="Qm… or bafy…"
        value={cid}
        onChange={(e) => setCid(e.target.value)}
        helper="The CID printed on the credential document."
      />
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying…
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Verify
          </>
        )}
      </Button>

      {result === true && (
        <Alert tone="success" title="Valid Credential">
          The credential exists on-chain and has not been revoked.
        </Alert>
      )}
      {result === false && (
        <Alert tone="danger" title="Invalid or Revoked">
          No matching active credential was found for this student/CID combination.
        </Alert>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
    </form>
  );
}

export default VerifyCredential;
