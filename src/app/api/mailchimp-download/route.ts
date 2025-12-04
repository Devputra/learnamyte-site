// src/app/api/mailchimp-download/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

type CourseCode = "FOQIC" | "Python" | "DASQL" | "DVPBI";

const COURSE_FILES: Record<CourseCode, string> = {
  FOQIC: "FOQIC.pdf",
  Python: "DOP.pdf",   // Data Optimization with Python
  DASQL: "DASQL.pdf",  // Data Analysis with SQL
  DVPBI: "DVPBI.pdf",  // Data Visualization with Power BI
};

interface MailchimpTag {
  name: string;
}

interface MailchimpMergeFields {
  COURSE?: string | null;
}

interface MailchimpMember {
  status?: string;
  tags?: MailchimpTag[];
  merge_fields?: MailchimpMergeFields;
}

function sign(payload: object, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

/**
 * Called by Mailchimp after final confirmation.
 * Redirect URL in Mailchimp:
 *   https://www.learnamyte.com/api/mailchimp-download?email=*|EMAIL|*
 */
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

  // 1) Get subscriber from Mailchimp
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

  const member = (await res.json()) as MailchimpMember;

  if (member.status !== "subscribed") {
    return NextResponse.json(
      {
        ok: false,
        error: "Email not yet confirmed. Please confirm from your inbox.",
      },
      { status: 400 },
    );
  }

  // 2) Determine the course from COURSE merge field or tags
  let course: CourseCode | null = null;

  const mergeCourse = member.merge_fields?.COURSE?.trim();
  if (mergeCourse && (mergeCourse in COURSE_FILES)) {
    course = mergeCourse as CourseCode;
  } else if (Array.isArray(member.tags)) {
    const tagNames = member.tags.map((t) => t.name);
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

  // 3) Create token for your existing /api/download route
  const exp = Math.floor(Date.now() / 1000) + 60 * 30; // 30 minutes
  const token = sign({ email, course, file, exp }, secret);
  const downloadUrl = `/api/download?t=${encodeURIComponent(token)}`;

  // 4) Redirect so browser immediately downloads the brochure
  return NextResponse.redirect(downloadUrl);
}
