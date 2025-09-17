import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const dc = process.env.MAILCHIMP_DC;
    const listId = process.env.MAILCHIMP_LIST_ID;

    if (!apiKey || !dc || !listId) {
      return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
    }

    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;

    // Basic auth (recommended by Mailchimp)
    const basic = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basic}`,
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        status: "subscribed",
      }),
      cache: "no-store",
    });

const data: unknown = await res.json().catch(() => ({}));

// Narrow error detail if present
let detail: string | undefined;
if (typeof data === "object" && data !== null && "detail" in data) {
  const d = (data as Record<string, unknown>).detail;
  if (typeof d === "string") {
    detail = d;
  }
}

if (!res.ok) {
  return NextResponse.json(
    { ok: false, error: detail || "Mailchimp error" },
    { status: 400 }
  );
}


    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
