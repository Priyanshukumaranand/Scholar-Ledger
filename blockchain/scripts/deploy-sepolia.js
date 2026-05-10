/**
 * Reliable Sepolia deploy script using ethers v6 directly.
 *
 * Bypasses Truffle's HDWalletProvider (which has a known flaky
 * polling-block-tracker that crashes the process on transient RPC errors).
 *
 * Usage:
 *   node scripts/deploy-sepolia.js
 *
 * Reads:
 *   - blockchain/.env  (DEPLOYER_PRIVATE_KEY, INFURA_KEY)
 *   - blockchain/build/contracts/*.json  (must run `truffle compile` first)
 *
 * Writes:
 *   - blockchain/deployed-sepolia.json  (the four contract addresses)
 *   - prints the addresses to stdout for copy-paste into env files
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const { DEPLOYER_PRIVATE_KEY, INFURA_KEY } = process.env;

if (!DEPLOYER_PRIVATE_KEY) {
  console.error("✗ DEPLOYER_PRIVATE_KEY missing in blockchain/.env");
  process.exit(1);
}
if (!INFURA_KEY) {
  console.error("✗ INFURA_KEY missing in blockchain/.env");
  process.exit(1);
}

const RPC_URL = `https://sepolia.infura.io/v3/${INFURA_KEY}`;
const BUILD_DIR = path.join(__dirname, "..", "build", "contracts");

const CONTRACTS_TO_DEPLOY = [
  { artifact: "ScholarLedger.json", envKey: "SCHOLAR_LEDGER_ADDRESS" },
  { artifact: "IssuerRegistry.json", envKey: "ISSUER_REGISTRY_ADDRESS" },
  { artifact: "StudentProfileRegistry.json", envKey: "STUDENT_PROFILE_REGISTRY_ADDRESS" },
  { artifact: "AccreditationRegistry.json", envKey: "ACCREDITATION_REGISTRY_ADDRESS" },
];

const loadArtifact = (filename) => {
  const fullPath = path.join(BUILD_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    throw new Error(
      `Artifact not found: ${fullPath}\nRun \`npx truffle compile\` first.`
    );
  }
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
};

const main = async () => {
  const pkRaw = DEPLOYER_PRIVATE_KEY.replace(/^0x/, "");
  const pk = "0x" + pkRaw;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(pk, provider);

  const network = await provider.getNetwork();
  const balanceWei = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balanceWei);

  console.log("");
  console.log("  Network:  ", network.name, "(chainId", network.chainId.toString() + ")");
  console.log("  Deployer: ", wallet.address);
  console.log("  Balance:  ", balanceEth, "ETH");
  console.log("");

  if (Number(balanceEth) < 0.02) {
    throw new Error(
      "Balance below 0.02 ETH — top up from a faucet before deploying."
    );
  }

  const deployed = {};
  for (const { artifact, envKey } of CONTRACTS_TO_DEPLOY) {
    const meta = loadArtifact(artifact);
    const name = meta.contractName;
    console.log(`  → Deploying ${name} …`);
    const factory = new ethers.ContractFactory(meta.abi, meta.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    const deployTx = contract.deploymentTransaction();
    console.log(`    ✓ ${name}: ${address}`);
    console.log(`      tx: ${deployTx.hash}`);
    deployed[envKey] = address;
    deployed[`${envKey}__contract`] = name;
  }

  const finalBalanceWei = await provider.getBalance(wallet.address);
  const spentEth = ethers.formatEther(balanceWei - finalBalanceWei);

  console.log("");
  console.log("  ✓ All four contracts deployed.");
  console.log("    Gas spent:", spentEth, "ETH");
  console.log("");

  const out = {
    network: "sepolia",
    chainId: Number(network.chainId),
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
    addresses: {
      SCHOLAR_LEDGER_ADDRESS: deployed.SCHOLAR_LEDGER_ADDRESS,
      ISSUER_REGISTRY_ADDRESS: deployed.ISSUER_REGISTRY_ADDRESS,
      STUDENT_PROFILE_REGISTRY_ADDRESS: deployed.STUDENT_PROFILE_REGISTRY_ADDRESS,
      ACCREDITATION_REGISTRY_ADDRESS: deployed.ACCREDITATION_REGISTRY_ADDRESS,
    },
  };
  const outPath = path.join(__dirname, "..", "deployed-sepolia.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("  Saved addresses to:", outPath);
  console.log("");
  console.log("  ===== Copy these into your env files =====");
  console.log("");
  console.log("  Frontend (client/.env):");
  console.log("    REACT_APP_CONTRACT_ADDRESS=" + out.addresses.SCHOLAR_LEDGER_ADDRESS);
  console.log("    REACT_APP_ISSUER_REGISTRY_ADDRESS=" + out.addresses.ISSUER_REGISTRY_ADDRESS);
  console.log("    REACT_APP_STUDENT_PROFILE_REGISTRY_ADDRESS=" + out.addresses.STUDENT_PROFILE_REGISTRY_ADDRESS);
  console.log("    REACT_APP_ACCREDITATION_REGISTRY_ADDRESS=" + out.addresses.ACCREDITATION_REGISTRY_ADDRESS);
  console.log("");
  console.log("  Backend (backend/.env):");
  console.log("    SCHOLAR_LEDGER_ADDRESS=" + out.addresses.SCHOLAR_LEDGER_ADDRESS);
  console.log("    ISSUER_REGISTRY_ADDRESS=" + out.addresses.ISSUER_REGISTRY_ADDRESS);
  console.log("    STUDENT_PROFILE_REGISTRY_ADDRESS=" + out.addresses.STUDENT_PROFILE_REGISTRY_ADDRESS);
  console.log("    ACCREDITATION_REGISTRY_ADDRESS=" + out.addresses.ACCREDITATION_REGISTRY_ADDRESS);
  console.log("");
};

main().catch((err) => {
  console.error("");
  console.error("  ✗ Deploy failed:", err.message);
  console.error("");
  process.exit(1);
});
