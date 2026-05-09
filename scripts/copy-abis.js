#!/usr/bin/env node
/**
 * Copies the relevant fields (abi + networks) from
 *   blockchain/build/contracts/<Name>.json
 * into the frontend and backend ABI directories.
 *
 * Run AFTER `truffle migrate --reset --network ganache`:
 *   node scripts/copy-abis.js
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "blockchain", "build", "contracts");
const clientAbiDir = path.join(root, "client", "src", "abi");
const backendAbiDir = path.join(root, "backend", "abi");

const contracts = [
  "ScholarLedger",
  "IssuerRegistry",
  "StudentProfileRegistry",
  "AccreditationRegistry",
];

if (!fs.existsSync(buildDir)) {
  console.error("[copy-abis] No build directory at", buildDir);
  console.error("           Run `truffle migrate --reset --network ganache` first.");
  process.exit(1);
}

[clientAbiDir, backendAbiDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const summary = [];

for (const name of contracts) {
  const srcPath = path.join(buildDir, `${name}.json`);
  if (!fs.existsSync(srcPath)) {
    console.warn(`[copy-abis] Missing ${srcPath} — skipped`);
    continue;
  }
  const truffleArtifact = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
  // Trim to just abi + contractName to keep checked-in files lean.
  const trimmed = {
    contractName: truffleArtifact.contractName,
    abi: truffleArtifact.abi,
  };
  const json = JSON.stringify(trimmed, null, 2);

  fs.writeFileSync(path.join(clientAbiDir, `${name}.json`), json);
  fs.writeFileSync(path.join(backendAbiDir, `${name}.json`), json);

  // Extract latest network deployment if present
  const networks = truffleArtifact.networks || {};
  const networkIds = Object.keys(networks);
  const latestNetworkId = networkIds[networkIds.length - 1];
  const address = latestNetworkId ? networks[latestNetworkId].address : null;

  summary.push({ name, address });
}

console.log("\n=== Scholar Ledger — ABI copy summary ===");
for (const { name, address } of summary) {
  console.log(`  ${name.padEnd(24)} ${address || "(no deployment found)"}`);
}
console.log("=========================================");
console.log("\nNext: paste the addresses above into client/.env and backend/.env");
console.log("      then restart `npm start` (client) and `npm start` (backend).\n");
