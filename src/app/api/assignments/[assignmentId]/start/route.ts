import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/authz";
import { shuffle } from "@/lib/engine/distribution";
import { one } from "@/lib/utils";

export async function POST(_: Request, ctx: { params: { assignmentId: string } }) {
  const user = await requireUser();
  const {assignmentId} = ctx.params;
  
  // validate assignment ownership + get test settings
  const supabase = supabaseServer();
  const { data: a, error: aErr } = await supabase
    .from("test_assignments")
    .select(`
      id, status, employee_id, test_id,
      tests ( id, starts_at, ends_at, duration_seconds, shuffle_questions, shuffle_options )
    `)
    .eq("id", assignmentId)
    .single();

  if (aErr) return Response.json({ error: aErr.message }, { status: 404 });
  if (a.employee_id !== user.id) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

  const now = new Date();
  const test = one(a.tests);
  if (!test) return Response.json({ error: "TEST_NOT_FOUND" }, { status: 404 });

  const startsAt = new Date(test.starts_at);
  const endsAtWindow = new Date(test.ends_at);
  if (now < startsAt || now > endsAtWindow) {
    return Response.json({ error: "NOT_IN_AVAILABILITY_WINDOW" }, { status: 400 });
  }
  if (a.status === "SUBMITTED" || a.status === "EXPIRED") {
    return Response.json({ error: "ASSIGNMENT_LOCKED" }, { status: 400 });
  }

  // if attempt exists, return it
  const existing = await supabaseAdmin
    .from("attempts")
    .select("id, started_at, ends_at, submitted_at")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (!existing.error && existing.data?.id) {
    return Response.json({ attemptId: existing.data.id, endsAt: existing.data.ends_at });
  }

  const startedAt = new Date();
  const attemptEndsAt = new Date(startedAt.getTime() + test.duration_seconds * 1000);

  // create attempt
  const attemptIns = await supabaseAdmin
    .from("attempts")
    .insert({
      assignment_id: assignmentId,
      started_at: startedAt.toISOString(),
      ends_at: attemptEndsAt.toISOString(),
    })
    .select("id")
    .single();

  if (attemptIns.error) return Response.json({ error: attemptIns.error.message }, { status: 400 });
  const attemptId = attemptIns.data.id as string;

  // mark assignment in progress
  await supabaseAdmin
    .from("test_assignments")
    .update({ status: "IN_PROGRESS" })
    .eq("id", assignmentId);

  // get materialized assignment question set
  const asq = await supabaseAdmin
    .from("assignment_questions")
    .select("question_id")
    .eq("assignment_id", assignmentId);

  if (asq.error) return Response.json({ error: asq.error.message }, { status: 400 });
  const questionIds = asq.data.map((r: any) => r.question_id as string);

  // question order
  const orderedQuestionIds = test.shuffle_questions
    ? shuffle(questionIds, `Q:${attemptId}`)
    : questionIds;

  // fetch options for all questions
  const opts = await supabaseAdmin
    .from("question_options")
    .select("id, question_id")
    .in("question_id", orderedQuestionIds);

  if (opts.error) return Response.json({ error: opts.error.message }, { status: 400 });

  const optionIdsByQid = new Map<string, string[]>();
  for (const row of opts.data as any[]) {
    const qid = row.question_id as string;
    optionIdsByQid.set(qid, [...(optionIdsByQid.get(qid) ?? []), row.id as string]);
  }

  // build attempt_questions rows
  const atqRows = orderedQuestionIds.map((qid, idx) => {
    const baseOptionIds = optionIdsByQid.get(qid) ?? [];
    const optionOrder = test.shuffle_options
      ? shuffle(baseOptionIds, `O:${attemptId}:${qid}`)
      : baseOptionIds;

    return {
      attempt_id: attemptId,
      question_id: qid,
      question_order: idx + 1,
      option_order: optionOrder,
    };
  });

  const atqIns = await supabaseAdmin.from("attempt_questions").insert(atqRows);
  if (atqIns.error) return Response.json({ error: atqIns.error.message }, { status: 400 });

  return Response.json({ attemptId, endsAt: attemptEndsAt.toISOString() });
}
