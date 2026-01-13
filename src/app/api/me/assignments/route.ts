// src/app/api/me/assignments/route.ts
import { requireUser } from "@/lib/authz";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseServer();

  const { data, error: qErr } = await supabase
    .from("test_assignments")
    .select(`
      id,
      status,
      assigned_at,
      test_id,
      tests (
        id,
        title,
        starts_at,
        ends_at,
        duration_seconds,
        pass_percent,
        show_score_to_employee
      ),
      attempts (
        id,
        started_at,
        submitted_at,
        attempt_results (
          percent,
          passed
        )
      )
    `)
    .eq("employee_id", user.id)
    .order("assigned_at", { ascending: false });

  if (qErr) return Response.json({ error: qErr.message }, { status: 400 });

  // Security: if a test is configured to hide score from employees,
  // strip attempt_results in API response (so UI can't show it accidentally).
  const sanitized = (data ?? []).map((row: any) => {
    const test = Array.isArray(row.tests) ? row.tests[0] : row.tests;
    const show = !!test?.show_score_to_employee;

    if (!show && Array.isArray(row.attempts)) {
      row.attempts = row.attempts.map((a: any) => ({ ...a, attempt_results: null }));
    }
    return row;
  });

  return Response.json({ assignments: sanitized });
}
