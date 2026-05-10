import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  ShieldCheck,
  Layers,
  ScanLine,
  Send,
  Building2,
  UserCircle,
  Settings,
  Award,
  Activity,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import ThemeToggle from "./ui/ThemeToggle";

const navLinkBase =
  "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150";

const navLink = ({ isActive }) =>
  `${navLinkBase} ${
    isActive
      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
      : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800/60 dark:hover:text-ink-100"
  }`;

function NavItem({ to, end, icon: Icon, children, onClick }) {
  return (
    <NavLink to={to} end={end} className={navLink} onClick={onClick}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </NavLink>
  );
}

function Navbar() {
  const { account, canIssue, isAdmin, isAccreditationAuthority } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu whenever the user navigates (handles browser back/forward
  // and programmatic redirects, not just NavItem clicks).
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const close = () => setMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-ink-200 shadow-soft dark:bg-ink-950/85 dark:border-ink-800"
          : "bg-white/0 dark:bg-ink-950/0 border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold tracking-tighter text-ink-900 dark:text-ink-50">
                Scholar Ledger
              </div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-500">
                Verified Credentials
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 ml-6">
            <NavItem to="/" end icon={HomeIcon}>Home</NavItem>
            <NavItem to="/verify" icon={ShieldCheck}>Verify</NavItem>
            <NavItem to="/bulk-verify" icon={Layers}>Bulk Verify</NavItem>
            <NavItem to="/scan" icon={ScanLine}>Scan</NavItem>
            {canIssue && <NavItem to="/bulk-issue" icon={Send}>Bulk Issue</NavItem>}
            {canIssue && <NavItem to="/activity" icon={Activity}>Activity</NavItem>}
            {canIssue && !isAdmin && <NavItem to="/issuer-settings" icon={Building2}>Institution</NavItem>}
            {isAdmin && <NavItem to="/admin" icon={Settings}>Admin</NavItem>}
            {isAccreditationAuthority && (
              <NavItem to="/accreditation" icon={Award}>Accreditation</NavItem>
            )}
            {account && !isAdmin && !canIssue && (
              <NavItem to="/profile-settings" icon={UserCircle}>My Profile</NavItem>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 text-ink-600 dark:text-ink-300"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-950 px-4 py-3 flex flex-col gap-1 animate-slide-down">
          <NavItem to="/" end icon={HomeIcon} onClick={close}>Home</NavItem>
          <NavItem to="/verify" icon={ShieldCheck} onClick={close}>Verify</NavItem>
          <NavItem to="/bulk-verify" icon={Layers} onClick={close}>Bulk Verify</NavItem>
          <NavItem to="/scan" icon={ScanLine} onClick={close}>Scan QR</NavItem>
          {canIssue && <NavItem to="/bulk-issue" icon={Send} onClick={close}>Bulk Issue</NavItem>}
          {canIssue && <NavItem to="/activity" icon={Activity} onClick={close}>Activity</NavItem>}
          {canIssue && !isAdmin && <NavItem to="/issuer-settings" icon={Building2} onClick={close}>Institution</NavItem>}
          {isAdmin && <NavItem to="/admin" icon={Settings} onClick={close}>Admin</NavItem>}
          {isAccreditationAuthority && (
            <NavItem to="/accreditation" icon={Award} onClick={close}>Accreditation</NavItem>
          )}
          {account && !isAdmin && !canIssue && (
            <NavItem to="/profile-settings" icon={UserCircle} onClick={close}>My Profile</NavItem>
          )}
        </nav>
      )}
    </header>
  );
}

export default Navbar;
