// src/app/api/certificate/[token]/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { getCertificateByToken } from "@/lib/certificates";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> },
) {

  const { token } = await context.params;

  const certificate = await getCertificateByToken(token);
  if (!certificate) {
    return NextResponse.json(
      { ok: false, error: "Certificate not found" },
      { status: 404 },
    );
  }

  const filename = `${certificate.certificateId}.pdf`;
  const abs = path.join(process.cwd(), "public", "certificates", filename);

  try {
    const buf = await fs.readFile(abs);
    const ab = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "PDF file not found on server" },
      { status: 404 },
    );
  }
}
