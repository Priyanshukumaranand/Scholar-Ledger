import VerifyCredential from "../components/VerifyCredential";

function VerifyManual() {
  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <h1>Manual Credential Verification</h1>
      <p style={{ color: "#555" }}>
        Have an IPFS CID and a student wallet address? Verify directly against
        the blockchain. No login required.
      </p>
      <VerifyCredential />
    </div>
  );
}

export default VerifyManual;
