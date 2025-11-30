import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_ISSUE_SECRET = process.env.ADMIN_ISSUE_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_ISSUE_SECRET) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_ISSUE_SECRET not configured" },
        { status: 500 },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase env missing", {
        SUPABASE_URL,
        hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
      });
      return NextResponse.json(
        { ok: false, error: "Supabase configuration missing" },
        { status: 500 },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      adminSecret,
      learnerName,
      learnerEmail,
      courseName,
      courseCode,
      completedOn,
    } = await req.json();

    if (
      process.env.NODE_ENV === "production" &&
      adminSecret !== ADMIN_ISSUE_SECRET
    ) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!learnerName || !courseName || !courseCode || !completedOn) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const certificateId = `${courseCode}-LN01-2511-001`;
    const verifyToken = `c_${Math.random().toString(36).slice(2, 10)}`;

    const { error } = await supabase.from("certificates").insert({
      certificate_id: certificateId,
      token: verifyToken,
      learner_name: learnerName,
      learner_email: learnerEmail || null,
      course_name: courseName,
      course_code: courseCode,
      completed_on: completedOn,
      issued_by: "admin",
      status: "valid",
    });

    if (error) {
      console.error("[api/admin/certificates] Supabase insert error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"; // see #2 below

    const verifyUrl = `${baseUrl}/verify/${verifyToken}`;

    return NextResponse.json(
      {
        ok: true,
        certificate: {
          certificateId,
          token: verifyToken,
          learnerName,
          learnerEmail,
          courseName,
          courseCode,
          completedOn,
        },
        verifyUrl,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/admin/certificates] error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
