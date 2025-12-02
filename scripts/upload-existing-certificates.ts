import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { uploadCertificatePdfToStorage } from "@/lib/certificateStorage";

async function main() {
  console.log("🚀 Starting upload-existing-certificates script");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    console.error("SUPABASE_URL =", process.env.SUPABASE_URL);
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY present? ",
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    );
    process.exit(1);
  }

  const baseDir = path.join(process.cwd(), "public", "certificates");
  console.log("Looking in:", baseDir);

  const entries = await fs.readdir(baseDir);
  const pdfFiles = entries.filter((name) =>
    name.toLowerCase().endsWith(".pdf"),
  );

  console.log("Found files:", entries);
  console.log("PDFs to upload:", pdfFiles);

  if (pdfFiles.length === 0) {
    console.log("No PDF files found in public/certificates. Exiting.");
    return;
  }

  for (const file of pdfFiles) {
    const abs = path.join(baseDir, file);
    const buf = await fs.readFile(abs);
    const certificateId = path.basename(file, ".pdf");

    console.log(`Uploading ${file} as certificateId=${certificateId}...`);

    await uploadCertificatePdfToStorage({
      certificateId,
      pdfBytes: buf,
    });

    console.log(`✅ Uploaded ${file}`);
  }

  console.log("🎓 All certificate PDFs uploaded to Supabase Storage.");
}

main().catch((err) => {
  console.error("❌ Upload script failed:", err);
  process.exit(1);
});
