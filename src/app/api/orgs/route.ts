// src/app/api/orgs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUserFromBearer } from "@/lib/authz";

function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return s || "org";
}

function randSuffix(len = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUserFromBearer(req);
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  const { data: memberships, error: mErr } = await supabaseAdmin
    .from("org_memberships")
    .select("org_id, role")
    .eq("user_id", user.id);

  if (mErr) return NextResponse.json({ ok: false, error: mErr.message }, { status: 500 });

  const orgIds = (memberships ?? []).map((m) => m.org_id);
  if (orgIds.length === 0) return NextResponse.json({ ok: true, orgs: [] });

  const { data: orgs, error: oErr } = await supabaseAdmin
    .from("organizations")
    .select("id, name, slug, created_at")
    .in("id", orgIds)
    .order("created_at", { ascending: false });

  if (oErr) return NextResponse.json({ ok: false, error: oErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    orgs: orgs ?? [],
    memberships: memberships ?? [],
  });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUserFromBearer(req);
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "Organization name required" }, { status: 400 });

  // Generate slug and guarantee uniqueness
  const base = slugify(name);

  let lastErr: any = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${randSuffix()}`;

    const { data: org, error: oErr } = await supabaseAdmin
      .from("organizations")
      .insert({ name, slug, created_by: user.id })
      .select("id, name, slug, created_at")
      .single();

    if (!oErr) {
      const { error: mErr } = await supabaseAdmin.from("org_memberships").insert({
        org_id: org.id,
        user_id: user.id,
        role: "OWNER",
      });

      if (mErr) return NextResponse.json({ ok: false, error: mErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, org });
    }

    // If slug collision, retry. Otherwise fail immediately.
    lastErr = oErr;
    const msg = String(oErr.message ?? "");
    const code = (oErr as any).code;

    const isUniqueViolation = code === "23505" || /duplicate key|unique/i.test(msg);
    if (!isUniqueViolation) {
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
  }

  return NextResponse.json(
    { ok: false, error: `Failed to create unique slug for org. Last error: ${String(lastErr?.message ?? lastErr)}` },
    { status: 500 }
  );
}
