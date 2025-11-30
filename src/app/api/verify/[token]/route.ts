// src/app/api/verify/[token]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCertificateByToken } from "@/lib/certificates";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  // In Next 15 validator, params is wrapped in a Promise
  const { token } = await context.params;

  if (!token || typeof token !== "string") {
    return NextResponse.json(
      { ok: false, error: "Invalid token" },
      { status: 400 },
    );
  }

  const cert = await getCertificateByToken(token);

  if (!cert) {
    return NextResponse.json(
      { ok: false, error: "Certificate not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      certificate: {
        certificateId: cert.certificateId,
        learnerName: cert.learnerName,
        learnerEmail: cert.learnerEmail,
        courseName: cert.courseName,
        courseCode: cert.courseCode,
        completedOn: cert.completedOn,
        issuedBy: cert.issuedBy,
        status: cert.status,
        createdAt: cert.createdAt,
      },
    },
    { status: 200 },
  );
}
