import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

// Camera-based QR scanner. Decodes a Scholar Ledger verification URL and
// redirects to the public verify page. Falls back to manual input if camera
// access is unavailable.
function QrScanner() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const containerId = "scholar-qr-reader";
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  const handleDecoded = (decodedText) => {
    try {
      const url = new URL(decodedText);
      const match = url.pathname.match(/^\/verify\/([^/]+)\/([^/]+)\/?$/);
      if (match) {
        navigate(`/verify/${match[1]}/${match[2]}`);
        return;
      }
      const profileMatch = url.pathname.match(/^\/profile\/([^/]+)\/?$/);
      if (profileMatch) {
        navigate(`/profile/${profileMatch[1]}`);
        return;
      }
      setError("QR was decoded but is not a recognized Scholar Ledger link.");
    } catch {
      setError("QR did not contain a valid URL.");
    }
  };

  // Safely tears down the scanner regardless of its current state.
  // Without the isScanning guard, calling stop() on a not-yet-started or
  // already-stopped scanner throws "Cannot stop, scanner is not running or paused"
  // — this happens routinely under React StrictMode where effects run twice.
  const safeTeardown = (scanner) => {
    if (!scanner) return Promise.resolve();
    const clear = () => {
      try {
        scanner.clear();
      } catch {
        // ignore — DOM may already be detached
      }
    };
    if (scanner.isScanning) {
      return scanner.stop().then(clear, clear);
    }
    clear();
    return Promise.resolve();
  };

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cancelled) return;
        if (!cameras || cameras.length === 0) {
          setError("No camera detected on this device.");
          return;
        }
        const cameraId =
          cameras.find((c) => /back|environment/i.test(c.label))?.id ||
          cameras[0].id;
        return scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            safeTeardown(scanner).finally(() => handleDecoded(decodedText));
          },
          () => {
            // ignore per-frame decode failures
          }
        );
      })
      .then(() => {
        if (!cancelled) setScanning(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Camera access denied or unavailable. " + (err?.message || ""));
        }
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      safeTeardown(s);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    handleDecoded(manualUrl.trim());
  };

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      <h2>Scan Credential QR Code</h2>
      <p style={{ color: "#555" }}>
        Point your camera at a Scholar Ledger QR code. You will be redirected to
        the verification page automatically.
      </p>

      <div
        id={containerId}
        style={{
          width: "100%",
          minHeight: "300px",
          background: "#000",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />

      {scanning && !error && (
        <p style={{ color: "#0a7d24", marginTop: "10px" }}>
          📷 Scanner active — hold a QR code in front of the camera.
        </p>
      )}

      {error && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            background: "#ffe6e6",
            border: "1px solid #b00020",
            borderRadius: "6px",
            color: "#b00020",
          }}
        >
          {error}
        </div>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h3>Or paste a verification link</h3>
      <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="https://...verify/0xStudent/0"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          style={{ flex: 1, padding: "8px" }}
        />
        <button type="submit">Open</button>
      </form>
    </div>
  );
}

export default QrScanner;
