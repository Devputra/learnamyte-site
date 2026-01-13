import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/mailer";
import { one } from "@/lib/utils";

function requireCronAuth(req: Request) {
  const got = req.headers.get("x-cron-secret");
  if (!got || got !== process.env.CRON_SECRET) throw new Error("FORBIDDEN");
}

export async function GET(req: Request) {
  try {
    requireCronAuth(req);

    const now = new Date();

    // 1) Mark expired assignments where test window ended
    await supabaseAdmin.rpc("noop"); // optional placeholder if you want DB RPC later

    // simple expiry update (window ended)
    const exp = await supabaseAdmin
      .from("test_assignments")
      .update({ status: "EXPIRED" })
      .eq("status", "NOT_STARTED")
      .lt("tests.ends_at" as any, now.toISOString()); // note: for robust expiry, do a SQL function instead

    // 2) Find assignments needing reminder
    const { data, error } = await supabaseAdmin
      .from("test_assignments")
      .select(`
        id, employee_id, test_id, reminder_cutoff_at, last_reminded_at,
        tests!inner ( title, ends_at )
      `)
      .eq("status", "NOT_STARTED")
      .lte("reminder_cutoff_at", now.toISOString());

    if (error) return Response.json({ error: error.message }, { status: 400 });

    for (const a of data as any[]) {
      // basic throttle: remind at most once every 12 hours
      if (a.last_reminded_at) {
        const last = new Date(a.last_reminded_at);
        if (now.getTime() - last.getTime() < 12 * 3600_000) continue;
      }

      // TODO: fetch employee email from auth.users via Admin API if needed,
      // or store email in profiles table and keep it synced.
      // For v1: store employee email in profiles or a separate table.

      // Placeholder: if you store email in profiles:
      const prof = await supabaseAdmin.from("profiles").select("full_name").eq("user_id", a.employee_id).maybeSingle();

      const subject = `Reminder: ${a.tests.title} assessment pending`;
      const test = one(a.tests);
      if (!test) continue;

      const html = `
      <p>Your assessment <b>${test.title}</b> is pending.</p>
      <p>Deadline: ${new Date(test.ends_at).toLocaleString()}</p>
      <p><a href="${process.env.APP_BASE_URL}/employee/assignments/${a.id}">Start now</a></p>
        `;

      // sendEmail({ to: "employee@example.com", subject, html });
      // NOTE: you must resolve recipient email.

      await supabaseAdmin.from("test_assignments").update({ last_reminded_at: now.toISOString() }).eq("id", a.id);
    }

    return Response.json({ ok: true, checked: data?.length ?? 0 });
  } catch (e: any) {
    return Response.json({ error: e.message ?? "CRON_ERROR" }, { status: 403 });
  }
}
