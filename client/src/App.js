import { WalletProvider } from "./context/WalletContext";
import ConnectWallet from "./components/ConnectWallet";
import StudentDashboard from "./components/StudentDashboard";
import UploadCredential from "./components/UploadCredential";
import VerifyCredential from "./components/VerifyCredential";

// BUG-07: WalletProvider wraps the entire tree so all components share one wallet state
// BUG-19: UploadCredential renders null internally when isAdmin is false,
//         so non-admins never see the issue form
function App() {
  return (
    <WalletProvider>
      <div style={{ padding: "40px" }}>
        <h1>Scholar Ledger</h1>
        <ConnectWallet />
        <StudentDashboard />
        <UploadCredential />
        <hr style={{ margin: "60px 0" }} />
        <h2>Public Credential Verification</h2>
        <p>
          Verify any credential using the student wallet address and IPFS CID.
        </p>
        <VerifyCredential />
      </div>
    </WalletProvider>
  );
}

export default App;
