import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Layers,
  Award,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import ConnectWallet from "../components/ConnectWallet";
import StudentDashboard from "../components/StudentDashboard";
import UploadCredential from "../components/UploadCredential";
import useDocumentTitle from "../utils/useDocumentTitle";

function FeatureCard({ icon: Icon, title, description, to }) {
  const content = (
    <div className="group h-full rounded-xl border border-ink-200 bg-white p-5 shadow-card transition-all hover:border-brand-300 hover:shadow-elevated hover:-translate-y-0.5 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-700">
      <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 flex items-center justify-center mb-3 transition-colors group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
        {title}
      </h3>
      <p className="mt-1 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
        {description}
      </p>
      {to && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
          Open
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      )}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function Home() {
  useDocumentTitle();
  const { account, canIssue } = useWallet();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-ink-200 bg-white p-8 sm:p-12 dark:border-ink-800 dark:bg-ink-900">
        <div className="absolute inset-0 bg-brand-mesh pointer-events-none" />
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-48 w-48 rounded-full bg-brand-700/10 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-300 backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Blockchain-anchored academic credentials
          </div>

          <h1 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tightest text-ink-900 dark:text-ink-50 max-w-3xl leading-tight">
            Issue, share, and verify credentials{" "}
            <span className="gradient-text">tamper-proof, forever.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-ink-600 dark:text-ink-400 max-w-2xl leading-relaxed">
            Universities issue credentials anchored on a public blockchain.
            Students share QR-coded PDFs. Recruiters verify in seconds — no
            wallet, no signup, no waiting.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-glow"
            >
              <ShieldCheck className="h-4 w-4" />
              Verify a credential
            </Link>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-soft transition-all hover:bg-ink-50 hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800"
            >
              <ScanLine className="h-4 w-4" />
              Scan QR
            </Link>
          </div>
        </div>
      </section>

      {/* Connection card */}
      <ConnectWallet />

      {/* Quick links — public actions are always visible */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            Quick actions
          </h2>
          {account && (
            <Link
              to={`/profile/${account}`}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              View public profile →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <FeatureCard
            icon={ShieldCheck}
            title="Verify Credential"
            description="Confirm a credential's authenticity on-chain."
            to="/verify"
          />
          <FeatureCard
            icon={Layers}
            title="Bulk Verify"
            description="CSV-driven batch verification with results export."
            to="/bulk-verify"
          />
          {canIssue && (
            <FeatureCard
              icon={Award}
              title="Bulk Issue"
              description="Issue many credentials in one atomic transaction."
              to="/bulk-issue"
            />
          )}
          <FeatureCard
            icon={ScanLine}
            title="Scan QR"
            description="Scan any Scholar Ledger QR with your camera."
            to="/scan"
          />
        </div>
      </section>

      {/* Dashboard */}
      <StudentDashboard />

      {/* Issue (admin only) */}
      {canIssue && <UploadCredential />}
    </div>
  );
}

export default Home;
