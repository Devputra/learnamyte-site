// src/app/api/verify/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCertificateByToken } from "@/lib/certificates";

// In Next 15, `params` is a Promise in route handlers
type RouteParams = {
  token: string;
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  // Await params to get the token
  const { token } = await context.params;

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
        token: cert.token,
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
