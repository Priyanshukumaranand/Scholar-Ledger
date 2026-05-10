import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getReadOnlyContract } from "../utils/readOnlyContract";
import { EXPECTED_CHAIN_ID, switchToExpectedChain } from "../utils/network";

const WalletContext = createContext(null);

const initialRoleState = {
  isAdmin: false,
  canIssue: false,
  isSuperAdmin: false,
  isAccreditationAuthority: false,
};

const parseChainId = (raw) => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    return raw.startsWith("0x") ? parseInt(raw, 16) : Number(raw);
  }
  return null;
};

export function WalletProvider({ children }) {
  const [account, setAccount] = useState("");
  const [roleState, setRoleState] = useState(initialRoleState);
  const [chainId, setChainId] = useState(null);

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
      // ignore
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
      throw new Error("MetaMask is not installed.");
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const addr = accounts[0];
    setAccount(addr);
    await resolveRoles(addr);
  };

  const switchNetwork = async () => {
    await switchToExpectedChain();
  };

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: "eth_chainId" })
      .then((id) => setChainId(parseChainId(id)))
      .catch(() => {});

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

    const handleChainChanged = (newChainId) => {
      setChainId(parseChainId(newChainId));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [resolveRoles]);

  const isWrongNetwork =
    chainId !== null && chainId !== EXPECTED_CHAIN_ID;

  const value = {
    account,
    chainId,
    expectedChainId: EXPECTED_CHAIN_ID,
    isWrongNetwork,
    ...roleState,
    connectWallet,
    switchNetwork,
    refreshRoles: () => resolveRoles(account),
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
