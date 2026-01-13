import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireOrgRole, requireUserFromBearer } from "@/lib/authz";

const EMPLOYER_ROLES = ["OWNER", "ADMIN", "EMPLOYER"] as const;

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function shuffle<T>(arr: T[], rand = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseEmails(raw: string | string[]): string[] {
  const s = Array.isArray(raw) ? raw.join("\n") : raw;
  return Array.from(
    new Set(
      s
        .split(/[\n,; ]+/g)
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

async function resolveUserIdByEmail(email: string): Promise<string> {
  // 1) attempt invite (creates user if not exists)
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

  if (!error && data?.user?.id) return data.user.id;

  // 2) on duplicates / already registered, resolve via RPC (recommended)
  const msg = error?.message ?? "";
  if (/already|exists|duplicate|23505|registered/i.test(msg)) {
    const { data: uid, error: rpcErr } = await supabaseAdmin.rpc("get_user_id_by_email", { p_email: email });
    if (rpcErr || !uid) {
      throw new Error(
        `User exists but cannot resolve id for ${email}. Add RPC get_user_id_by_email() in SQL (recommended).`
      );
    }
    return String(uid);
  }

  throw new Error(`Invite failed for ${email}: ${msg || "unknown error"}`);
}

export async function POST(req: NextRequest, ctx:{ params :Promise<{ testId: string } >}) {
  const { user, error } = await requireUserFromBearer(req);
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { testId } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const emails = parseEmails(body.emails ?? []);
  if (emails.length === 0) return NextResponse.json({ error: "Provide at least 1 email" }, { status: 400 });
  if (emails.length > 500) return NextResponse.json({ error: "Too many emails in one request (max 500)" }, { status: 400 });

  const reminderCutoffHours = Number(body.reminderCutoffHours ?? 24);
  if (!Number.isFinite(reminderCutoffHours) || reminderCutoffHours < 0 || reminderCutoffHours > 24 * 30) {
    return NextResponse.json({ error: "reminderCutoffHours invalid" }, { status: 400 });
  }

  // Load test meta
  const { data: test, error: tErr } = await supabaseAdmin
    .from("tests")
    .select("id, org_id, title, ends_at, starts_at, distribution, per_candidate_count")
    .eq("id", testId)
    .single();

  if (tErr || !test) return NextResponse.json({ error: tErr?.message ?? "Test not found" }, { status: 404 });

  const result = await requireOrgRole({ userId: user.id, orgId: test.org_id, allow: [...EMPLOYER_ROLES] });
  if (!result.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch pool
  const { data: poolRows, error: pErr } = await supabaseAdmin
    .from("test_question_pool")
    .select("question_id")
    .eq("test_id", testId);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const pool = (poolRows ?? []).map((r: any) => r.question_id).filter(Boolean);
  if (pool.length === 0) return NextResponse.json({ error: "Test has no questions in pool yet" }, { status: 400 });

  const per = Math.max(1, Number(test.per_candidate_count ?? 1));
  const effectivePer = Math.min(per, pool.length);

  // Resolve users
  const resolved: { email: string; user_id: string; status: "ok" | "fail"; reason?: string }[] = [];
  for (const email of emails) {
    try {
      const uid = await resolveUserIdByEmail(email);
      resolved.push({ email, user_id: uid, status: "ok" });
    } catch (e: any) {
      resolved.push({ email, user_id: "", status: "fail", reason: e?.message ?? "unknown" });
    }
  }

  const okUsers = resolved.filter((r) => r.status === "ok").map((r) => r.user_id);
  if (okUsers.length === 0) {
    return NextResponse.json({ error: "No users could be resolved/invited", resolved }, { status: 400 });
  }

  // Ensure org memberships (insert only missing, do NOT overwrite existing roles)
  const { data: existingM, error: mErr } = await supabaseAdmin
    .from("org_memberships")
    .select("user_id")
    .eq("org_id", test.org_id)
    .in("user_id", okUsers);

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const existingSet = new Set((existingM ?? []).map((r: any) => r.user_id));
  const missing = okUsers.filter((uid) => !existingSet.has(uid));

  if (missing.length > 0) {
    const { error: insMErr } = await supabaseAdmin
      .from("org_memberships")
      .insert(missing.map((uid) => ({ org_id: test.org_id, user_id: uid, role: "EMPLOYEE" })));

    if (insMErr) return NextResponse.json({ error: insMErr.message }, { status: 500 });
  }

  // Decide distribution
  let mode = String(test.distribution ?? "AUTO");
  if (mode === "AUTO") {
    // If pool can support disjoint subsets, do it; else same-set shuffled.
    mode = pool.length >= okUsers.length * effectivePer ? "RANDOM_SUBSET" : "SAME_SET_SHUFFLED";
  }

  const nowIso = new Date().toISOString();
  const endAt = new Date(test.ends_at);
  const reminderCutoffAt = new Date(endAt.getTime() - reminderCutoffHours * 3600 * 1000).toISOString();

  // Fetch existing assignments
  const { data: existingA, error: aErr } = await supabaseAdmin
    .from("test_assignments")
    .select("id, employee_id, status")
    .eq("test_id", testId)
    .in("employee_id", okUsers);

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const existingByEmp = new Map<string, any>();
  for (const a of existingA ?? []) existingByEmp.set(a.employee_id, a);

  const toInsert = okUsers
    .filter((uid) => !existingByEmp.has(uid))
    .map((uid) => ({
      test_id: testId,
      employee_id: uid,
      status: "NOT_STARTED",
      assigned_at: nowIso,
      reminder_cutoff_at: reminderCutoffAt,
    }));

  let inserted: any[] = [];
  if (toInsert.length > 0) {
    const { data, error: insErr } = await supabaseAdmin
      .from("test_assignments")
      .insert(toInsert)
      .select("id, employee_id, status");

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    inserted = data ?? [];
  }

  // Eligible for (re)distribution: newly inserted + existing NOT_STARTED
  const eligible = [
    ...(existingA ?? []).filter((a: any) => a.status === "NOT_STARTED"),
    ...inserted,
  ];

  // Build per-employee question sets
  const questionSetByEmp = new Map<string, string[]>();

  if (mode === "RANDOM_SUBSET" && pool.length >= eligible.length * effectivePer) {
    const shuffledPool = shuffle(pool);
    eligible.forEach((a: any, idx: number) => {
      const start = idx * effectivePer;
      questionSetByEmp.set(a.employee_id, shuffledPool.slice(start, start + effectivePer));
    });
  } else {
    // SAME_SET_SHUFFLED (or fallback)
    const rand = mulberry32(seedFromString(testId));
    const canonical = shuffle(pool, rand).slice(0, effectivePer);
    eligible.forEach((a: any) => questionSetByEmp.set(a.employee_id, canonical));
    mode = "SAME_SET_SHUFFLED";
  }

  // Rewrite assignment_questions for eligible assignments
  const eligibleIds = eligible.map((a: any) => a.id);

  if (eligibleIds.length > 0) {
    const { error: delErr } = await supabaseAdmin
      .from("assignment_questions")
      .delete()
      .in("assignment_id", eligibleIds);

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    const aqRows: any[] = [];
    for (const a of eligible) {
      const qids = questionSetByEmp.get(a.employee_id) ?? [];
      for (const qid of qids) {
        aqRows.push({ assignment_id: a.id, question_id: qid });
      }
    }

    const { error: aqErr } = await supabaseAdmin.from("assignment_questions").insert(aqRows);
    if (aqErr) return NextResponse.json({ error: aqErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    test: { id: test.id, title: test.title },
    mode_used: mode,
    per_candidate_count: effectivePer,
    assigned_new: inserted.length,
    assigned_total_not_started_updated: eligible.length,
    resolved,
  });
}
