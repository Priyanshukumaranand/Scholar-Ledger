import { useWallet } from "../context/WalletContext";
import { Link } from "react-router-dom";
import ConnectWallet from "../components/ConnectWallet";
import StudentDashboard from "../components/StudentDashboard";
import UploadCredential from "../components/UploadCredential";

// Home page = the connected-wallet experience.
// Public verification, profile, and scanner live on their own routes
// and do not require a wallet at all.
function Home() {
  const { account } = useWallet();

  return (
    <div>
      <ConnectWallet />

      {account && (
        <p style={{ fontSize: "13px", color: "#555", marginBottom: "20px" }}>
          Need to share your credentials publicly?{" "}
          <Link to={`/profile/${account}`}>View your public profile →</Link>
        </p>
      )}

      <StudentDashboard />
      <UploadCredential />
    </div>
  );
}

export default Home;
