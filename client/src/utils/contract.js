import { ethers } from "ethers";
import ScholarLedger from "../abi/ScholarLedger.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const GANACHE_CHAIN_ID = "0x539"; // 1337

// BUG-11: throws a readable error instead of returning undefined
// BUG-12: wraps wallet_switchEthereumChain so a user dismissal gives a clear message
export const getContract = async () => {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install it to use this app."
    );
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GANACHE_CHAIN_ID }],
    });
  } catch (switchError) {
    throw new Error(
      "Please switch MetaMask to the Ganache network (Chain ID 1337) and try again."
    );
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(CONTRACT_ADDRESS, ScholarLedger.abi, signer);
};
