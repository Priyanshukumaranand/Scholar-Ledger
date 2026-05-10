import { useState } from "react";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { chainName, expectedChainName } from "../utils/network";
import { useToast } from "../context/ToastContext";
import { humanizeError } from "../utils/errors";

function NetworkBanner() {
  const { isWrongNetwork, chainId, expectedChainId, switchNetwork } = useWallet();
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!isWrongNetwork) return null;

  const handleSwitch = async () => {
    setBusy(true);
    try {
      await switchNetwork();
    } catch (err) {
      pushToast({
        tone: "danger",
        title: "Network switch failed",
        message: humanizeError(err),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/40">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Wrong network.</span>{" "}
            You're connected to <span className="font-mono">{chainName(chainId)}</span>.{" "}
            Scholar Ledger runs on{" "}
            <span className="font-mono">{expectedChainName()}</span> (chain {expectedChainId}).
          </div>
        </div>
        <button
          onClick={handleSwitch}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          {busy ? "Switching…" : "Switch network"}
        </button>
      </div>
    </div>
  );
}

export default NetworkBanner;
