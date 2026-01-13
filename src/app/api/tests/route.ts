import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireOrgRole, requireUserFromBearer } from "@/lib/authz";

const EMPLOYER_ROLES = ["OWNER", "ADMIN", "EMPLOYER"] as const;

export async function GET(req: NextRequest) {
  const { user, error } = await requireUserFromBearer(req);
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const result = await requireOrgRole({ orgId, userId: user.id, allow: [...EMPLOYER_ROLES] });
  if (!result.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error: qErr } = await supabaseAdmin
    .from("tests")
    .select(
      "id, org_id, title, description, starts_at, ends_at, duration_seconds, distribution, per_candidate_count, shuffle_questions, shuffle_options, pass_percent, show_score_to_employee, show_correct_after_submit, created_at"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  return NextResponse.json({ tests: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUserFromBearer(req);
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const orgId = String(body.orgId ?? "");
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const result = await requireOrgRole({ orgId, userId: user.id, allow: [...EMPLOYER_ROLES] });
  if (!result.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const endsAt = body.endsAt ? new Date(body.endsAt) : null;

  if (!startsAt || isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "startsAt is required (valid datetime)" }, { status: 400 });
  }
  if (!endsAt || isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "endsAt is required (valid datetime)" }, { status: 400 });
  }
  if (endsAt <= startsAt) {
    return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
  }

  const durationSeconds = Number(body.durationSeconds ?? 0);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return NextResponse.json({ error: "durationSeconds must be > 0" }, { status: 400 });
  }

  const perCandidateCount = Number(body.perCandidateCount ?? 0);
  if (!Number.isFinite(perCandidateCount) || perCandidateCount <= 0) {
    return NextResponse.json({ error: "perCandidateCount must be > 0" }, { status: 400 });
  }

  const distribution = String(body.distribution ?? "AUTO");
  const shuffleQuestions = Boolean(body.shuffleQuestions ?? true);
  const shuffleOptions = Boolean(body.shuffleOptions ?? true);

  const passPercent = Number(body.passPercent ?? 0);
  const showScoreToEmployee = Boolean(body.showScoreToEmployee ?? true);
  const showCorrectAfterSubmit = Boolean(body.showCorrectAfterSubmit ?? false);

  const payload = {
    org_id: orgId,
    created_by: user.id,
    title,
    description: String(body.description ?? "").trim() || null,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    duration_seconds: durationSeconds,
    distribution,
    per_candidate_count: perCandidateCount,
    shuffle_questions: shuffleQuestions,
    shuffle_options: shuffleOptions,
    pass_percent: passPercent,
    show_score_to_employee: showScoreToEmployee,
    show_correct_after_submit: showCorrectAfterSubmit,
  };

  const { data, error: insErr } = await supabaseAdmin
    .from("tests")
    .insert(payload)
    .select("id")
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
