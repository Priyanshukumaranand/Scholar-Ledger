/**
 * Pre-deploy sanity check.
 * Run with: npx truffle exec scripts/preflight.js --network sepolia
 *
 * Verifies:
 *  - blockchain/.env is readable and both vars are set
 *  - Infura RPC connects
 *  - Deployer private key produces a valid address
 *  - Deployer has enough Sepolia ETH to cover the migration
 */

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error(
        "No accounts available. Is DEPLOYER_PRIVATE_KEY set in blockchain/.env?"
      );
    }
    const deployer = accounts[0];
    const balanceWei = await web3.eth.getBalance(deployer);
    const balanceEth = web3.utils.fromWei(balanceWei, "ether");
    const blockNumber = await web3.eth.getBlockNumber();
    const chainId = await web3.eth.getChainId();

    console.log("");
    console.log("  ✓ Connected to RPC");
    console.log("    Chain ID:        ", chainId.toString());
    console.log("    Latest block:    ", blockNumber.toString());
    console.log("    Deployer address:", deployer);
    console.log("    Balance:         ", balanceEth, "ETH");
    console.log("");

    if (Number(balanceEth) < 0.02) {
      console.warn(
        "  ⚠ Balance below 0.02 ETH — deploy may run out of gas. Top up from a faucet."
      );
    } else {
      console.log("  ✓ Balance is sufficient for deploy.");
    }
    console.log("");
    callback();
  } catch (err) {
    console.error("");
    console.error("  ✗ Preflight failed:", err.message);
    console.error("");
    callback(err);
  }
};
