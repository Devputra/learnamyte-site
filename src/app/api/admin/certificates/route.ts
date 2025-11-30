// src/app/api/admin/certificates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { issueCertificate } from "@/lib/certificates";

const ADMIN_ISSUE_SECRET = process.env.ADMIN_ISSUE_SECRET;

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_ISSUE_SECRET) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_ISSUE_SECRET not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();

    // Admin secret can come from body or header
    const adminSecretFromBody = (body.adminSecret as string | undefined) ?? "";
    const adminSecretFromHeader = req.headers.get("x-admin-secret") ?? "";
    const adminSecret = adminSecretFromBody || adminSecretFromHeader;

    // Only enforce the secret check in production
    if (process.env.NODE_ENV === "production" && adminSecret !== ADMIN_ISSUE_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const learnerName = (body.learnerName as string | undefined)?.trim() ?? "";
    const learnerEmail =
      (body.learnerEmail as string | undefined)?.trim() || undefined;
    const courseName = (body.courseName as string | undefined)?.trim() ?? "";
    const courseCode = (body.courseCode as string | undefined)?.trim() ?? "";
    const completedOn = (body.completedOn as string | undefined)?.trim() ?? "";

    if (!learnerName || !courseName || !courseCode || !completedOn) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const certificate = await issueCertificate({
      learnerName,
      learnerEmail,
      courseName,
      courseCode,
      completedOn,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const normalizedBase = baseUrl.replace(/\/+$/, "");
    const verifyUrl = `${normalizedBase}/verify/${certificate.token}`;

    return NextResponse.json({
      ok: true,
      certificate,
      verifyUrl,
    });
  } catch (err) {
    console.error("[api/admin/certificates] error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
