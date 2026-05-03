import { jsPDF } from "jspdf";
import QRCode from "qrcode";

// Generates a printable PDF for a credential with an embedded verification QR code.
// The QR points at the public verification URL (no wallet required to verify).
// The IPFS CID + gateway URL are also rendered so a verifier can fetch the
// original document directly.
export const generateCredentialPDF = async ({
  studentAddress,
  cidHash,
  cid,
  title,
  issuedOn,
  revoked,
  issuer,
  verifyUrl,
  ipfsUrl,
}) => {
  const finalVerifyUrl =
    verifyUrl || `${window.location.origin}/verify/${studentAddress}/0`;

  const qrDataUrl = await QRCode.toDataURL(finalVerifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
  });

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Decorative header
  doc.setFillColor(20, 40, 90);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("SCHOLAR LEDGER", pageWidth / 2, 45, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Blockchain-Verified Academic Credential", pageWidth / 2, 65, {
    align: "center",
  });

  // Body
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Certificate of Achievement", pageWidth / 2, 140, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("This is to certify that the holder of wallet address", pageWidth / 2, 175, {
    align: "center",
  });

  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text(studentAddress, pageWidth / 2, 195, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("has been awarded the following credential:", pageWidth / 2, 220, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 40, 90);
  doc.text(title, pageWidth / 2, 260, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Metadata block
  let cursorY = 320;
  const labelX = 70;
  const valueX = 170;
  const lineGap = 18;

  const writeRow = (label, value, mono = false, smaller = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, labelX, cursorY);
    doc.setFont(mono ? "courier" : "helvetica", "normal");
    doc.setFontSize(smaller ? 8 : 10);
    doc.text(value, valueX, cursorY, { maxWidth: pageWidth - valueX - 60 });
    cursorY += lineGap;
  };

  writeRow("Issued On:", issuedOn);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Status:", labelX, cursorY);
  doc.setFont("helvetica", "normal");
  if (revoked) {
    doc.setTextColor(180, 0, 0);
    doc.text("REVOKED", valueX, cursorY);
  } else {
    doc.setTextColor(0, 130, 0);
    doc.text("ACTIVE", valueX, cursorY);
  }
  doc.setTextColor(0, 0, 0);
  cursorY += lineGap;

  writeRow("Issuer Address:", issuer, true, true);

  if (cid) {
    writeRow("IPFS CID:", cid, true, true);
  }

  writeRow("CID Hash:", cidHash, true, true);

  // QR section
  const qrSize = 130;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = Math.max(cursorY + 30, 470);
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Scan QR or visit the link below to verify on-chain:", pageWidth / 2, qrY + qrSize + 22, {
    align: "center",
  });
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text(finalVerifyUrl, pageWidth / 2, qrY + qrSize + 38, { align: "center" });

  if (ipfsUrl) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("View document on IPFS:", pageWidth / 2, qrY + qrSize + 60, {
      align: "center",
    });
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text(ipfsUrl, pageWidth / 2, qrY + qrSize + 74, { align: "center" });
  }

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "This credential is anchored on a public blockchain. Anyone with the QR code or link above can independently verify its authenticity.",
    pageWidth / 2,
    800,
    { align: "center", maxWidth: pageWidth - 80 }
  );

  const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`scholar-ledger-${safeTitle}.pdf`);
};
