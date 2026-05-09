import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, ScanLine, ArrowRight } from "lucide-react";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import useDocumentTitle from "../utils/useDocumentTitle";

function QrScanner() {
  useDocumentTitle("Scan QR");
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const containerId = "scholar-qr-reader";
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  const handleDecoded = (decodedText) => {
    try {
      const url = new URL(decodedText);
      const verifyMatch = url.pathname.match(/^\/verify\/([^/]+)\/([^/]+)\/?$/);
      if (verifyMatch) {
        navigate(`/verify/${verifyMatch[1]}/${verifyMatch[2]}`);
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

  const safeTeardown = (scanner) => {
    if (!scanner) return Promise.resolve();
    const clear = () => {
      try {
        scanner.clear();
      } catch {
        // ignore
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
            // ignore per-frame failures
          }
        );
      })
      .then(() => {
        if (!cancelled) setScanning(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            "Camera access denied or unavailable. " + (err?.message || "")
          );
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
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader
          title="Scan Credential QR"
          subtitle="Point your camera at a Scholar Ledger QR code. You'll be redirected to the verification page automatically."
        />

        <div
          id={containerId}
          className="w-full min-h-[300px] bg-black rounded-xl overflow-hidden ring-1 ring-ink-200 dark:ring-ink-800"
        />

        {scanning && !error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <Camera className="h-4 w-4" />
            Scanner active — hold a QR code in front of the camera.
          </div>
        )}

        {error && (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <hr className="my-6 border-ink-200 dark:border-ink-800" />

        <form onSubmit={handleManualSubmit} className="space-y-3">
          <Input
            label="Or paste a verification link"
            placeholder="https://…/verify/0xStudent/0"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            <ScanLine className="h-4 w-4" />
            Open
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default QrScanner;
