import { ethers } from "ethers";
import ScholarLedger from "../abi/ScholarLedger.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const RPC_URL = process.env.REACT_APP_RPC_URL;

// Read-only contract instance — no MetaMask required.
// Used by public verification, public profile, and the QR scan flow
// so that anyone (including verifiers without a wallet) can read on-chain data.
let cachedProvider = null;
let cachedContract = null;

const getProvider = () => {
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return cachedProvider;
};

export const getReadOnlyContract = () => {
  if (!cachedContract) {
    cachedContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ScholarLedger.abi,
      getProvider()
    );
  }
  return cachedContract;
};
