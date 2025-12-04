// /src/app/api/lead/route.ts
import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

// Add the other courses your UI can send
type CourseCode = "FOQIC" | "Python" | "DASQL" | "DVPBI";

type Body = { email: string; phone: string; course: CourseCode };

// Map course → brochure filename
const COURSE_FILES: Record<CourseCode, string> = {
  FOQIC: "FOQIC.pdf",
  Python: "DOP.pdf",     // Data Optimization with Python
  DASQL: "DASQL.pdf",    // Data Analysis with SQL
  DVPBI: "DVPBI.pdf",    // Data Visualization with Power BI
};

function sign(payload: object, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export async function POST(req: Request) {
  try {
    const { email, phone, course } = (await req.json()) as Body;

    if (!email || !phone || !course) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 },
      );
    }

    const file = COURSE_FILES[course];
    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Invalid course" },
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
    const membersUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;

    // Upsert/create with POST (double opt-in)
    const createRes = await fetch(membersUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basic}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: "pending",
        merge_fields: { PHONE: phone },
      }),
      cache: "no-store",
    });

    const createData = (await createRes.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (!createRes.ok && createData?.title !== "Member Exists") {
      const msg =
        (typeof createData?.detail === "string" && createData.detail) ||
        (typeof createData?.title === "string" && createData.title) ||
        "Could not add you to the list. Please try again.";
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    // Check current member status
    const hash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
    const getRes = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}`,
      { headers: { Authorization: `Basic ${basic}` }, cache: "no-store" },
    );

    let memberStatus:
      | "subscribed"
      | "pending"
      | "cleaned"
      | "unsubscribed"
      | "transactional"
      | undefined;

    if (getRes.ok) {
      const member = (await getRes.json()) as { status?: typeof memberStatus };
      memberStatus = member?.status;
    }

    // Require double opt-in
    if (memberStatus !== "subscribed") {
      return NextResponse.json(
        {
          ok: false,
          requireConfirm: true,
          error:
            "Almost done! We’ve sent a confirmation email. Please confirm to get the brochure.",
        },
        { status: 202 },
      );
    }

    // Tag by course (best-effort)
    await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}/tags`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basic}`,
        },
        body: JSON.stringify({ tags: [{ name: course, status: "active" }] }),
        cache: "no-store",
      },
    ).catch(() => null);

    // Signed, short-lived download link
    const exp = Math.floor(Date.now() / 1000) + 60 * 30; // 30 min
    const token = sign({ email, course, file, exp }, secret);
    const downloadUrl = `/api/download?t=${encodeURIComponent(token)}`;

    return NextResponse.json({ ok: true, downloadUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
