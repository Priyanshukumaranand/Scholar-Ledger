require("dotenv").config();

const config = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:7545",
  contracts: {
    scholarLedger: process.env.SCHOLAR_LEDGER_ADDRESS,
    issuerRegistry: process.env.ISSUER_REGISTRY_ADDRESS,
    studentProfileRegistry: process.env.STUDENT_PROFILE_REGISTRY_ADDRESS,
    accreditationRegistry: process.env.ACCREDITATION_REGISTRY_ADDRESS,
  },

  ipfsGateway: process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs/",

  email: {
    apiKey: process.env.RESEND_API_KEY || "",
    from: process.env.RESEND_FROM || "Scholar Ledger <onboarding@resend.dev>",
    enabled: Boolean(process.env.RESEND_API_KEY),
  },
};

const required = [
  "scholarLedger",
  "issuerRegistry",
  "studentProfileRegistry",
  "accreditationRegistry",
];
for (const key of required) {
  if (!config.contracts[key]) {
    console.warn(
      `[config] Warning: ${key} contract address not set in .env — that endpoint group will return errors until configured.`
    );
  }
}

module.exports = config;
