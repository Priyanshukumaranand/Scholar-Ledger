import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const linkStyle = (path) => ({
    padding: "8px 14px",
    textDecoration: "none",
    color: location.pathname === path ? "#fff" : "#14285a",
    backgroundColor: location.pathname === path ? "#14285a" : "transparent",
    borderRadius: "4px",
    fontWeight: "500",
  });

  return (
    <nav
      style={{
        display: "flex",
        gap: "8px",
        padding: "12px 0",
        borderBottom: "1px solid #ddd",
        marginBottom: "30px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <h2 style={{ margin: 0, marginRight: "20px", color: "#14285a" }}>
        Scholar Ledger
      </h2>
      <Link to="/" style={linkStyle("/")}>
        Home
      </Link>
      <Link to="/verify" style={linkStyle("/verify")}>
        Verify
      </Link>
      <Link to="/scan" style={linkStyle("/scan")}>
        Scan QR
      </Link>
    </nav>
  );
}

export default Navbar;
