/**
 * Maps low-level wallet / RPC / contract errors into plain-language sentences
 * the user can act on. Always returns a non-empty string.
 */
export function humanizeError(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;

  const code = err.code || err.error?.code;
  const reason = err.reason || err.shortMessage || err.error?.message || err.message || "";
  const lower = String(reason).toLowerCase();

  if (code === 4001 || code === "ACTION_REJECTED" || lower.includes("user rejected") || lower.includes("user denied")) {
    return "You declined the request in MetaMask.";
  }
  if (code === -32002 || lower.includes("already pending")) {
    return "MetaMask already has a pending request — open it and approve or reject the queued one.";
  }
  if (code === "INSUFFICIENT_FUNDS" || lower.includes("insufficient funds")) {
    return "Your wallet doesn't have enough ETH to cover the transaction fee.";
  }
  if (code === "NETWORK_ERROR" || lower.includes("network changed") || lower.includes("underlying network changed")) {
    return "Your wallet network changed mid-request. Please retry.";
  }
  if (code === "UNSUPPORTED_OPERATION" && lower.includes("network")) {
    return "Cannot reach the blockchain right now. Check your connection or RPC settings.";
  }
  if (lower.includes("could not detect network")) {
    return "Cannot reach the blockchain RPC. Make sure Ganache (or your network) is running.";
  }
  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    return "Network request failed. Check that the backend and your blockchain node are running.";
  }
  if (/wrong network/i.test(lower)) {
    return reason;
  }
  if (code === "NONCE_EXPIRED" || lower.includes("nonce too low") || lower.includes("replacement transaction underpriced")) {
    return "Your wallet has a stale transaction. Reset MetaMask's account activity (Settings → Advanced → Clear activity tab) and retry.";
  }

  // Contract-level reverts — surface the require() message verbatim, prefixed.
  if (code === "CALL_EXCEPTION" || lower.includes("revert") || lower.includes("execution reverted")) {
    const cleaned = (err.reason || err.shortMessage || "").replace(/^execution reverted:?\s*/i, "").trim();
    if (cleaned) {
      const friendly = mapRevertMessage(cleaned);
      return friendly || `The contract rejected this: ${cleaned}`;
    }
    return "The blockchain rejected this transaction. The most common cause is missing permissions or a duplicate entry.";
  }

  if (lower.includes("metamask is not installed")) {
    return "MetaMask is not installed. Install the browser extension to continue.";
  }
  if (lower.includes("not configured")) {
    return "The app isn't configured to talk to this contract. Check the deployed addresses in the client .env file.";
  }
  if (lower.includes("ipfs") && lower.includes("upload")) {
    return "Upload to IPFS failed. Check that the backend is running and Pinata credentials are set.";
  }

  return reason || fallback;
}

const REVERT_MAP = [
  ["only super admin", "Only the super admin can perform this action."],
  ["not an admin", "You don't have admin permissions for this action."],
  ["not an issuer", "You don't have permission to issue credentials."],
  ["already issued", "This credential is already on the chain — try a different file."],
  ["duplicate in batch or already issued", "One or more credentials in the batch are duplicates of existing on-chain entries."],
  ["already revoked", "This credential is already revoked."],
  ["invalid student address", "The student address is invalid."],
  ["zero address", "A required address was empty (0x000…)."],
  ["empty title", "Credential title cannot be empty."],
  ["empty batch", "The batch is empty — add at least one row."],
  ["length mismatch", "The CSV is malformed — column counts don't match."],
  ["invalid index", "The credential index doesn't exist."],
  ["already super admin", "That wallet is already the super admin."],
  ["cannot revoke super admin", "The super admin role cannot be revoked — transfer it first."],
  ["only authority", "Only the accreditation authority can do this."],
  ["already accredited with this label", "This issuer already holds that accreditation label."],
  ["accreditation not found", "This issuer does not have that accreditation label."],
];

function mapRevertMessage(msg) {
  const lower = msg.toLowerCase();
  for (const [needle, friendly] of REVERT_MAP) {
    if (lower.includes(needle)) return friendly;
  }
  return null;
}
