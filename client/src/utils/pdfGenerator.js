import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { resolveIssuer, resolveStudent } from "./identity";

/**
 * Generates a printable credential PDF with embedded verification QR.
 * Resolves issuer and student names so the certificate reads as a real document
 * (e.g. "Awarded to Prince Kumar Singh by IIT Delhi") instead of bare addresses.
 */
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

  const [issuerProfile, studentProfile, qrDataUrl] = await Promise.all([
    resolveIssuer(issuer).catch(() => null),
    resolveStudent(studentAddress).catch(() => null),
    QRCode.toDataURL(finalVerifyUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
    }),
  ]);

  const issuerName = issuerProfile?.exists ? issuerProfile.name : null;
  const studentName = studentProfile?.name || null;
  const accreditations = issuerProfile?.accreditations || [];

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header bar
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

  // Title block
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Certificate of Achievement", pageWidth / 2, 140, {
    align: "center",
  });

  // "Awarded to..."
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("This is to certify that", pageWidth / 2, 175, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 40, 90);
  doc.text(studentName || "(Unregistered profile)", pageWidth / 2, 200, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);

  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.text(studentAddress, pageWidth / 2, 218, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("has been awarded the credential of", pageWidth / 2, 245, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 40, 90);
  doc.text(title, pageWidth / 2, 280, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Issuer line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Issued by", pageWidth / 2, 312, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(issuerName || "(Unregistered issuer)", pageWidth / 2, 332, {
    align: "center",
  });

  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.text(issuer, pageWidth / 2, 348, { align: "center" });

  if (accreditations.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(0, 130, 0);
    doc.text(
      "Accredited by " + accreditations.join(", "),
      pageWidth / 2,
      365,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
  }

  // Metadata block
  let cursorY = 410;
  const labelX = 70;
  const valueX = 170;
  const lineGap = 18;

  const writeRow = (label, value, mono = false, smaller = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, labelX, cursorY);
    doc.setFont(mono ? "courier" : "helvetica", "normal");
    doc.setFontSize(smaller ? 8 : 10);
    doc.text(String(value), valueX, cursorY, {
      maxWidth: pageWidth - valueX - 60,
    });
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

  if (cid) writeRow("IPFS CID:", cid, true, true);
  writeRow("CID Hash:", cidHash, true, true);

  // QR section
  const qrSize = 130;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = Math.max(cursorY + 30, 540);
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Scan QR or visit the link below to verify on-chain:",
    pageWidth / 2,
    qrY + qrSize + 22,
    { align: "center" }
  );
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text(finalVerifyUrl, pageWidth / 2, qrY + qrSize + 38, { align: "center" });

  if (ipfsUrl) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "View document on IPFS:",
      pageWidth / 2,
      qrY + qrSize + 60,
      { align: "center" }
    );
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
    810,
    { align: "center", maxWidth: pageWidth - 80 }
  );

  const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`scholar-ledger-${safeTitle}.pdf`);
};
