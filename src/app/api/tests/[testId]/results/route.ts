import { supabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/authz";

export async function GET(_: Request, ctx: { params: { testId: string } }) {
  await requireUser();
  const {testId} = ctx.params;
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("test_assignments")
    .select(`
      id, employee_id, status,
      attempts ( id, started_at, submitted_at ),
      attempts!left ( attempt_results ( score, max_score, percent, passed ) )
    `)
    .eq("test_id", testId);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ results: data });
}
