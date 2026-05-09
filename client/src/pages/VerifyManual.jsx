import VerifyCredential from "../components/VerifyCredential";
import Card, { CardHeader } from "../components/ui/Card";
import useDocumentTitle from "../utils/useDocumentTitle";

function VerifyManual() {
  useDocumentTitle("Verify Credential");
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader
          eyebrow="Verifier"
          title="Manual Credential Verification"
          subtitle="Verify any credential by pasting the student's wallet address and the IPFS CID. No login or wallet required."
        />
        <VerifyCredential />
      </Card>
    </div>
  );
}

export default VerifyManual;
