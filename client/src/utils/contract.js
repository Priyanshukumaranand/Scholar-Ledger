import { ethers } from "ethers";
import ScholarLedger from "../abi/ScholarLedger.json";
import IssuerRegistry from "../abi/IssuerRegistry.json";
import StudentProfileRegistry from "../abi/StudentProfileRegistry.json";
import AccreditationRegistry from "../abi/AccreditationRegistry.json";
import { EXPECTED_CHAIN_ID, expectedChainName } from "./network";

const ADDRESSES = {
  scholarLedger: process.env.REACT_APP_CONTRACT_ADDRESS,
  issuerRegistry: process.env.REACT_APP_ISSUER_REGISTRY_ADDRESS,
  studentProfileRegistry: process.env.REACT_APP_STUDENT_PROFILE_REGISTRY_ADDRESS,
  accreditationRegistry: process.env.REACT_APP_ACCREDITATION_REGISTRY_ADDRESS,
};

const ABIS = {
  scholarLedger: ScholarLedger.abi,
  issuerRegistry: IssuerRegistry.abi,
  studentProfileRegistry: StudentProfileRegistry.abi,
  accreditationRegistry: AccreditationRegistry.abi,
};

const requireMetaMask = () => {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install it to use this app."
    );
  }
};

const getSigner = async () => {
  requireMetaMask();
  const provider = new ethers.BrowserProvider(window.ethereum);
  // Validate chain rather than silently switching — the user is in control,
  // and the NetworkBanner is already showing them the situation.
  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);
  if (currentChainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Wrong network. Switch MetaMask to ${expectedChainName()} (chain ${EXPECTED_CHAIN_ID}) before signing this transaction.`
    );
  }
  return provider.getSigner();
};

export const getContract = async (key = "scholarLedger") => {
  const address = ADDRESSES[key];
  const abi = ABIS[key];
  if (!address) {
    throw new Error(
      `Contract address not configured for ${key}. Set REACT_APP_${key
        .replace(/[A-Z]/g, (m) => "_" + m)
        .toUpperCase()}_ADDRESS in .env`
    );
  }
  const signer = await getSigner();
  return new ethers.Contract(address, abi, signer);
};
