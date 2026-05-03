import { useWallet } from "../context/WalletContext";

// BUG-07: reads from shared WalletContext instead of managing isolated local state
function ConnectWallet() {
  const { account, isAdmin, connectWallet } = useWallet();

  return (
    <div style={{ marginBottom: "16px" }}>
      <button onClick={connectWallet}>
        {account ? "Wallet Connected" : "Connect Wallet"}
      </button>
      {account && (
        <p style={{ margin: "6px 0 0" }}>
          Connected: {account}{" "}
          <strong style={{ color: isAdmin ? "#0066cc" : "#333" }}>
            ({isAdmin ? "Admin" : "Student"})
          </strong>
        </p>
      )}
    </div>
  );
}

export default ConnectWallet;
