/**
 * Truffle config for Scholar Ledger.
 *
 *  - `ganache`  : local development (Ganache UI on port 7545)
 *  - `sepolia`  : public Ethereum testnet, used for the deployed demo
 *
 * Sepolia deploys read MNEMONIC and INFURA_KEY from blockchain/.env
 * (see blockchain/.env.example). Local deploys need nothing extra.
 */

require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

const { DEPLOYER_PRIVATE_KEY, INFURA_KEY } = process.env;

// HDWalletProvider accepts the key with or without the "0x" prefix; normalise.
const privateKeys = DEPLOYER_PRIVATE_KEY
  ? [DEPLOYER_PRIVATE_KEY.replace(/^0x/, "")]
  : [];

module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777,
    },

    sepolia: {
      provider: () =>
        new HDWalletProvider({
          privateKeys,
          providerOrUrl: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
        }),
      network_id: 11155111,
      // 1 confirmation is enough for a testnet demo and avoids
      // HDWalletProvider's flaky polling-block-tracker timeouts.
      confirmations: 1,
      timeoutBlocks: 200,
      networkCheckTimeout: 60000,
      skipDryRun: true,
    },
  },

  mocha: {},

  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: { enabled: true, runs: 200 },
        evmVersion: "london",
      },
    },
  },
};
