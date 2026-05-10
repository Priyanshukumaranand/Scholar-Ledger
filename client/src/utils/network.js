const RAW_CHAIN_ID = process.env.REACT_APP_CHAIN_ID;
const RPC_URL = process.env.REACT_APP_RPC_URL;

export const EXPECTED_CHAIN_ID = RAW_CHAIN_ID ? Number(RAW_CHAIN_ID) : 1337;

const KNOWN_CHAINS = {
  1: { name: "Ethereum Mainnet", currency: "ETH" },
  11155111: { name: "Sepolia", currency: "SepoliaETH" },
  1337: { name: "Ganache (1337)", currency: "ETH" },
  31337: { name: "Hardhat (31337)", currency: "ETH" },
  137: { name: "Polygon", currency: "MATIC" },
};

export const chainName = (id) => {
  if (!id) return "Unknown";
  return KNOWN_CHAINS[id]?.name || `Chain ${id}`;
};

export const expectedChainName = () => chainName(EXPECTED_CHAIN_ID);

const toHexChainId = (id) => "0x" + Number(id).toString(16);

export async function switchToExpectedChain() {
  if (!window.ethereum) throw new Error("MetaMask is not installed.");
  const hexId = toHexChainId(EXPECTED_CHAIN_ID);
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexId }],
    });
  } catch (err) {
    if (err && (err.code === 4902 || err.code === -32603)) {
      const meta = KNOWN_CHAINS[EXPECTED_CHAIN_ID] || {
        name: `Chain ${EXPECTED_CHAIN_ID}`,
        currency: "ETH",
      };
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexId,
            chainName: meta.name,
            nativeCurrency: { name: meta.currency, symbol: meta.currency, decimals: 18 },
            rpcUrls: RPC_URL ? [RPC_URL] : [],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}
