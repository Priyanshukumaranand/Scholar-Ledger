import { ethers } from "ethers";
import ScholarLedger from "../abi/ScholarLedger.json";
import IssuerRegistry from "../abi/IssuerRegistry.json";
import StudentProfileRegistry from "../abi/StudentProfileRegistry.json";
import AccreditationRegistry from "../abi/AccreditationRegistry.json";

// Fall back to Ganache UI's default port so a missing env var doesn't
// silently break every read call against the chain.
const RPC_URL = process.env.REACT_APP_RPC_URL || "http://127.0.0.1:7545";

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

let cachedProvider = null;
const cachedContracts = {};

const getProvider = () => {
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return cachedProvider;
};

export const getReadOnlyContract = (key = "scholarLedger") => {
  if (cachedContracts[key]) return cachedContracts[key];
  const address = ADDRESSES[key];
  const abi = ABIS[key];
  if (!address) {
    throw new Error(`Read-only contract not configured: ${key}`);
  }
  cachedContracts[key] = new ethers.Contract(address, abi, getProvider());
  return cachedContracts[key];
};
