/**
 * Scholar Ledger — Truffle Configuration
 *
 * Networks:
 *   ganache  — local Ganache GUI (port 7545)
 *   amoy     — Polygon Amoy Testnet (chain 80002, free faucet MATIC)
 *   polygon  — Polygon Mainnet (chain 137, real MATIC)
 *
 * For amoy / polygon deploys, set these env vars (or GitHub Secrets in CI):
 *   DEPLOYER_MNEMONIC  — 12-word wallet seed phrase
 *   POLYGON_RPC_URL    — e.g. https://rpc-amoy.polygon.technology
 *
 * More info: https://trufflesuite.com/docs/truffle/reference/configuration
 */

require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

const { DEPLOYER_MNEMONIC, POLYGON_RPC_URL } = process.env;

module.exports = {
  networks: {
    // ── Local development ────────────────────────────────────────
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777,
    },

    // ── Polygon Amoy Testnet ─────────────────────────────────────
    amoy: {
      provider: () =>
        new HDWalletProvider(
          DEPLOYER_MNEMONIC,
          POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology"
        ),
      network_id: 80002,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 80002,
    },

    // ── Polygon Mainnet (future use) ─────────────────────────────
    polygon: {
      provider: () =>
        new HDWalletProvider(
          DEPLOYER_MNEMONIC,
          POLYGON_RPC_URL || "https://polygon-rpc.com"
        ),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 137,
      gasPrice: 35000000000, // 35 gwei — adjust for mainnet conditions
    },
  },

  // Mocha test options
  mocha: {
    timeout: 120000, // 2 min — public networks can be slow
  },

  // Solidity compiler
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        evmVersion: "london",
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
