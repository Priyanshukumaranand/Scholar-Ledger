const { ethers } = require("ethers");
const config = require("../config");
const ScholarLedger = require("../../abi/ScholarLedger.json");
const IssuerRegistry = require("../../abi/IssuerRegistry.json");
const StudentProfileRegistry = require("../../abi/StudentProfileRegistry.json");
const AccreditationRegistry = require("../../abi/AccreditationRegistry.json");

const provider = new ethers.JsonRpcProvider(config.rpcUrl);

const make = (address, abi) =>
  address ? new ethers.Contract(address, abi, provider) : null;

const contracts = {
  scholarLedger: make(config.contracts.scholarLedger, ScholarLedger.abi),
  issuerRegistry: make(config.contracts.issuerRegistry, IssuerRegistry.abi),
  studentProfileRegistry: make(
    config.contracts.studentProfileRegistry,
    StudentProfileRegistry.abi
  ),
  accreditationRegistry: make(
    config.contracts.accreditationRegistry,
    AccreditationRegistry.abi
  ),
  provider,
};

const requireContract = (name) => {
  const c = contracts[name];
  if (!c) {
    const err = new Error(`Contract ${name} is not configured on the server`);
    err.statusCode = 503;
    throw err;
  }
  return c;
};

module.exports = { contracts, requireContract, provider };
