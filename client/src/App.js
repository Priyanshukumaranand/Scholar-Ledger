import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ShieldCheck, GraduationCap } from "lucide-react";
import { WalletProvider } from "./context/WalletContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import VerifyManual from "./pages/VerifyManual";
import PublicVerify from "./pages/PublicVerify";
import PublicProfile from "./pages/PublicProfile";
import QrScanner from "./pages/QrScanner";
import IssuerSettings from "./pages/IssuerSettings";
import StudentSettings from "./pages/StudentSettings";
import BulkIssue from "./pages/BulkIssue";
import BulkVerify from "./pages/BulkVerify";
import AdminPanel from "./pages/AdminPanel";
import AccreditationPanel from "./pages/AccreditationPanel";

function NotFound() {
  return (
    <div className="text-center py-24">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800 mb-4">
        <ShieldCheck className="h-7 w-7 text-ink-400" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
        404 — Page Not Found
      </h2>
      <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Back to Home
      </Link>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-200 dark:border-ink-800 mt-16 bg-white/40 dark:bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-ink-900 dark:text-ink-50">
                Scholar Ledger
              </div>
              <div className="text-[11px] text-ink-500 dark:text-ink-500">
                Blockchain-anchored academic credentials
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-500 dark:text-ink-400">
            <Link to="/verify" className="hover:text-ink-900 dark:hover:text-ink-100 transition-colors">
              Verify
            </Link>
            <Link to="/scan" className="hover:text-ink-900 dark:hover:text-ink-100 transition-colors">
              Scan
            </Link>
            <Link to="/bulk-verify" className="hover:text-ink-900 dark:hover:text-ink-100 transition-colors">
              Bulk Verify
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <WalletProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/verify" element={<VerifyManual />} />
                  <Route path="/verify/:address/:index" element={<PublicVerify />} />
                  <Route path="/profile/:address" element={<PublicProfile />} />
                  <Route path="/scan" element={<QrScanner />} />
                  <Route path="/issuer-settings" element={<IssuerSettings />} />
                  <Route path="/profile-settings" element={<StudentSettings />} />
                  <Route path="/bulk-issue" element={<BulkIssue />} />
                  <Route path="/bulk-verify" element={<BulkVerify />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/accreditation" element={<AccreditationPanel />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </WalletProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
