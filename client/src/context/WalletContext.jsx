import { createContext, useContext, useEffect, useState } from "react";
import { getContract } from "../utils/contract";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Resolves admin status for a given address without triggering MetaMask popup
  const resolveAdmin = async (addr) => {
    try {
      const contract = await getContract();
      const adminAddress = await contract.universityAdmin();
      setIsAdmin(addr.toLowerCase() === adminAddress.toLowerCase());
    } catch {
      setIsAdmin(false);
    }
  };

  // BUG-07: single shared connect entry-point used by ConnectWallet button
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
    await resolveAdmin(addr);
  };

  useEffect(() => {
    if (!window.ethereum) return;

    // BUG-09: use eth_accounts (no popup) to restore an already-connected session
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await resolveAdmin(accounts[0]);
        }
      });

    // BUG-08: keep wallet + admin state in sync when user switches accounts in MetaMask
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
        setIsAdmin(false);
      } else {
        setAccount(accounts[0]);
        await resolveAdmin(accounts[0]);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return (
    <WalletContext.Provider value={{ account, isAdmin, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
