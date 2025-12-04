import { NextResponse } from "next/server";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

function verify(token: string, secret: string) {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  if (!token) return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });

  const secret = process.env.DOWNLOAD_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });

  const payload = verify(token, secret);
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });

  const { file, exp } = payload as { file: string; exp: number };
  if (!file || !exp) return NextResponse.json({ ok: false, error: "Bad token" }, { status: 400 });
  if (Date.now() / 1000 > exp) return NextResponse.json({ ok: false, error: "Link expired" }, { status: 410 });

  const allow = new Set(["FOQIC.pdf", "DOP.pdf", "DASQL.pdf", "DVPBI.pdf"]);
  if (!allow.has(file)) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });

  const abs = path.join(process.cwd(), "public", "brochures", file);

  try {
    const buf = await fs.readFile(abs); // Node Buffer
    // Convert to ArrayBuffer so TS is happy with `Response` BodyInit
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "File not found" }, { status: 404 });
  }
}
