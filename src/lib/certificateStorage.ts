// src/lib/certificateStorage.ts
import { supabaseAdmin } from "./supabaseAdmin";

const CERT_BUCKET = "certificates";

function buildCertificatePdfPath(certificateId: string) {
  // e.g. "DOP-LN01-2511-001.pdf"
  return `${certificateId}.pdf`;
}

type PdfInput = Buffer | Uint8Array | ArrayBuffer;

function toNodeBuffer(pdf: PdfInput): Buffer {
  if (pdf instanceof Buffer) return pdf;
  if (pdf instanceof ArrayBuffer) return Buffer.from(pdf);
  // Uint8Array but not Buffer
  return Buffer.from(pdf.buffer, pdf.byteOffset, pdf.byteLength);
}

/**
 * Upload (or overwrite) a certificate PDF to Supabase Storage.
 * Use from server actions or route handlers.
 */
export async function uploadCertificatePdfToStorage(params: {
  certificateId: string;
  pdfBytes: PdfInput;
}) {
  const { certificateId, pdfBytes } = params;

  const filePath = buildCertificatePdfPath(certificateId);
  const fileBody = toNodeBuffer(pdfBytes);

  const { error } = await supabaseAdmin.storage
    .from(CERT_BUCKET)
    .upload(filePath, fileBody, {
      contentType: "application/pdf",
      upsert: true, // overwrite if re-issued
    });

  if (error) {
    console.error("Error uploading certificate PDF to Storage:", error);
    throw new Error("Failed to upload certificate PDF.");
  }

  return {
    bucket: CERT_BUCKET,
    path: filePath,
  };
}
