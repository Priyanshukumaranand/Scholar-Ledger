import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getReadOnlyContract } from "../utils/readOnlyContract";

const WalletContext = createContext(null);

const initialRoleState = {
  isAdmin: false,
  canIssue: false,
  isSuperAdmin: false,
  isAccreditationAuthority: false,
};

export function WalletProvider({ children }) {
  const [account, setAccount] = useState("");
  const [roleState, setRoleState] = useState(initialRoleState);

  // Resolves the connected wallet's roles across all relevant contracts.
  // Read-only — never triggers a wallet popup.
  const resolveRoles = useCallback(async (addr) => {
    if (!addr) {
      setRoleState(initialRoleState);
      return;
    }
    let next = { ...initialRoleState };
    try {
      const sl = getReadOnlyContract("scholarLedger");
      const [isAdmin, canIssue, superAdmin] = await Promise.all([
        sl.isAdmin(addr),
        sl.canIssue(addr),
        sl.superAdmin(),
      ]);
      next.isAdmin = Boolean(isAdmin);
      next.canIssue = Boolean(canIssue);
      next.isSuperAdmin =
        superAdmin && superAdmin.toLowerCase() === addr.toLowerCase();
    } catch {
      // ScholarLedger not configured — leave role flags false
    }
    try {
      const ar = getReadOnlyContract("accreditationRegistry");
      const authority = await ar.accreditationAuthority();
      next.isAccreditationAuthority =
        authority && authority.toLowerCase() === addr.toLowerCase();
    } catch {
      // ignore
    }
    setRoleState(next);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it to use this app.");
      return;
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const addr = accounts[0];
    setAccount(addr);
    await resolveRoles(addr);
  };

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await resolveRoles(accounts[0]);
        }
      });

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
        setRoleState(initialRoleState);
      } else {
        setAccount(accounts[0]);
        await resolveRoles(accounts[0]);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () =>
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
  }, [resolveRoles]);

  const value = {
    account,
    ...roleState,
    connectWallet,
    refreshRoles: () => resolveRoles(account),
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
