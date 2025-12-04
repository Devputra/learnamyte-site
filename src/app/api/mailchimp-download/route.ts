// src/app/api/mailchimp-download/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

type CourseCode = "FOQIC" | "Python" | "DASQL" | "DVPBI";

const COURSE_FILES: Record<CourseCode, string> = {
  FOQIC: "FOQIC.pdf",
  Python: "DOP.pdf",
  DASQL: "DASQL.pdf",
  DVPBI: "DVPBI.pdf",
};

function sign(payload: object, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Missing email" },
      { status: 400 },
    );
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const dc = process.env.MAILCHIMP_DC;
  const listId = process.env.MAILCHIMP_LIST_ID;
  const secret = process.env.DOWNLOAD_SECRET;

  if (!apiKey || !dc || !listId || !secret) {
    return NextResponse.json(
      { ok: false, error: "Server not configured" },
      { status: 500 },
    );
  }

  const basic = Buffer.from(`anystring:${apiKey}`).toString("base64");
  const hash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

  // 1) Fetch subscriber from Mailchimp
  const res = await fetch(
    `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}`,
    {
      headers: { Authorization: `Basic ${basic}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: "Subscriber not found" },
      { status: 404 },
    );
  }

  const member = (await res.json()) as any;

  if (member.status !== "subscribed") {
    return NextResponse.json(
      {
        ok: false,
        error: "Email not yet confirmed. Please confirm from your inbox.",
      },
      { status: 400 },
    );
  }

  // 2) Figure out which course from tags
  let course: CourseCode | null = null;

  if (Array.isArray(member.tags)) {
    const tagNames: string[] = member.tags.map((t: any) => String(t.name));
    const knownCourses: CourseCode[] = ["FOQIC", "Python", "DASQL", "DVPBI"];
    course = knownCourses.find((c) => tagNames.includes(c)) ?? null;
  }

  if (!course) {
    return NextResponse.json(
      { ok: false, error: "No course tag found for this subscriber." },
      { status: 400 },
    );
  }

  const file = COURSE_FILES[course];

  // 3) Create the same signed token your existing download route expects
  const exp = Math.floor(Date.now() / 1000) + 60 * 30; // 30 minutes
  const token = sign({ email, course, file, exp }, secret);
  const downloadUrl = `/api/download?t=${encodeURIComponent(token)}`;

  // 4) Redirect so the browser immediately downloads the brochure
  return NextResponse.redirect(downloadUrl);
}
