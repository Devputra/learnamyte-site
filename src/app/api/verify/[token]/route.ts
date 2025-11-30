// src/app/api/verify/[token]/route.ts
import { NextResponse } from "next/server";
import { getCertificateByToken, type CertificateRecord } from "@/lib/certificates";

type RouteParams = {
  token: string;
};

export async function GET(
  _req: Request,
  ctx: { params: RouteParams }
) {
  const { token } = ctx.params;

  const cert: CertificateRecord | null = await getCertificateByToken(token);

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
        learnerEmail: cert.learnerEmail, // 👈 now TS knows this exists
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
