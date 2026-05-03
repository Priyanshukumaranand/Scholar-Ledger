import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import VerifyManual from "./pages/VerifyManual";
import PublicVerify from "./pages/PublicVerify";
import PublicProfile from "./pages/PublicProfile";
import QrScanner from "./pages/QrScanner";

// Routes:
//   /                         — connected-wallet dashboard (admin + student)
//   /verify                   — manual verification form (no wallet needed)
//   /verify/:address/:index   — public auto-verify (no wallet needed)
//   /profile/:address         — public student profile (no wallet needed)
//   /scan                     — camera-based QR scanner
function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div style={{ padding: "20px 40px 60px", maxWidth: "1100px", margin: "0 auto" }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/verify" element={<VerifyManual />} />
            <Route path="/verify/:address/:index" element={<PublicVerify />} />
            <Route path="/profile/:address" element={<PublicProfile />} />
            <Route path="/scan" element={<QrScanner />} />
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <h2>404 — Page Not Found</h2>
                </div>
              }
            />
          </Routes>
        </div>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
