import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireOrgRole, requireUserFromBearer } from "@/lib/authz";

const EMPLOYER_ROLES = ["OWNER", "ADMIN", "EMPLOYER"] as const;

export async function GET(req: NextRequest, ctx: { params: Promise<{ testId: string }> }) {
  const { user, error } = await requireUserFromBearer(req);
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const {testId} = await ctx.params;

  const { data: test, error: tErr } = await supabaseAdmin
    .from("tests")
    .select(
      "id, org_id, title, description, starts_at, ends_at, duration_seconds, distribution, per_candidate_count, shuffle_questions, shuffle_options, pass_percent, show_score_to_employee, show_correct_after_submit"
    )
    .eq("id", testId)
    .single();

  if (tErr || !test) return NextResponse.json({ error: tErr?.message ?? "Test not found" }, { status: 404 });

  const result = await requireOrgRole({ orgId: test.org_id, userId: user.id, allow: [...EMPLOYER_ROLES] });
  if (!result.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: poolRows, error: pErr } = await supabaseAdmin
    .from("test_question_pool")
    .select("question_id")
    .eq("test_id", testId);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const qIds = (poolRows ?? []).map((r: any) => r.question_id).filter(Boolean);

  if (qIds.length === 0) {
    return NextResponse.json({ test, questions: [] });
  }

  const { data: questions, error: qErr } = await supabaseAdmin
    .from("questions")
    .select("id, text, marks, difficulty, tags, created_at")
    .in("id", qIds)
    .order("created_at", { ascending: true });

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const { data: options, error: oErr } = await supabaseAdmin
    .from("question_options")
    .select("id, question_id, option_text, option_index")
    .in("question_id", qIds)
    .order("option_index", { ascending: true });

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  const { data: correct, error: cErr } = await supabaseAdmin
    .from("question_correct_options")
    .select("question_id, option_id")
    .in("question_id", qIds);

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  const optionsByQ: Record<string, any[]> = {};
  for (const o of options ?? []) {
    (optionsByQ[o.question_id] ??= []).push(o);
  }

  const correctByQ: Record<string, string[]> = {};
  for (const c of correct ?? []) {
    (correctByQ[c.question_id] ??= []).push(c.option_id);
  }

  const merged = (questions ?? []).map((q: any) => ({
    ...q,
    options: optionsByQ[q.id] ?? [],
    correct_option_ids: correctByQ[q.id] ?? [],
  }));

  return NextResponse.json({ test, questions: merged });
}

export async function POST(req: NextRequest, { params }: { params: { testId: string } }) {
  const { user, error } = await requireUserFromBearer(req);
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const testId = params.testId;

  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  const marks = Number(body.marks ?? 1);
  const difficulty = body.difficulty == null ? null : Number(body.difficulty);
  const tags =
    typeof body.tags === "string"
      ? body.tags.split(",").map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(body.tags)
        ? body.tags
        : null;

  const options: string[] = Array.isArray(body.options) ? body.options.map((s: any) => String(s ?? "").trim()) : [];
  const correctIndex = Number(body.correctIndex ?? 0);

  if (!text) return NextResponse.json({ error: "Question text is required" }, { status: 400 });
  if (!Number.isFinite(marks) || marks <= 0) return NextResponse.json({ error: "marks must be > 0" }, { status: 400 });
  if (options.length < 2) return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
  if (options.some((o) => !o)) return NextResponse.json({ error: "Options cannot be empty" }, { status: 400 });
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    return NextResponse.json({ error: "correctIndex out of range" }, { status: 400 });
  }

  const { data: test, error: tErr } = await supabaseAdmin
    .from("tests")
    .select("id, org_id")
    .eq("id", testId)
    .single();

  if (tErr || !test) return NextResponse.json({ error: tErr?.message ?? "Test not found" }, { status: 404 });

  const result = await requireOrgRole({ orgId: test.org_id, userId: user.id, allow: ["OWNER", "ADMIN", "EMPLOYER"] });
  if (!result.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 1) create question
  const { data: qRow, error: qInsErr } = await supabaseAdmin
    .from("questions")
    .insert({
      org_id: test.org_id,
      created_by: user.id,
      text,
      marks,
      difficulty,
      tags,
    })
    .select("id")
    .single();

  if (qInsErr) return NextResponse.json({ error: qInsErr.message }, { status: 500 });

  const questionId = qRow.id;

  // 2) link into this test pool
  const { error: poolErr } = await supabaseAdmin
    .from("test_question_pool")
    .insert({ test_id: testId, question_id: questionId });

  if (poolErr) return NextResponse.json({ error: poolErr.message }, { status: 500 });

  // 3) insert options
  const optionRows = options.map((option_text, idx) => ({
    question_id: questionId,
    option_index: idx,
    option_text,
  }));

  const { data: insertedOptions, error: optErr } = await supabaseAdmin
    .from("question_options")
    .insert(optionRows)
    .select("id, option_index");

  if (optErr) return NextResponse.json({ error: optErr.message }, { status: 500 });

  const correctOption = (insertedOptions ?? []).find((o: any) => o.option_index === correctIndex);
  if (!correctOption?.id) {
    return NextResponse.json({ error: "Failed to resolve correct option id" }, { status: 500 });
  }

  // 4) store correct
  const { error: corrErr } = await supabaseAdmin
    .from("question_correct_options")
    .insert({ question_id: questionId, option_id: correctOption.id });

  if (corrErr) return NextResponse.json({ error: corrErr.message }, { status: 500 });

  return NextResponse.json({ id: questionId });
}
