"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authedFetch } from "@/lib/corp/authedFetch";

type Org = { id: string; name: string; slug: string | null; role: string };
type TestRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  duration_seconds: number;
  distribution: string;
  per_candidate_count: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
};

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

export default function EmployerHomePage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [tests, setTests] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const res = await authedFetch("/api/orgs");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load orgs");
        setOrgs(json.orgs ?? []);
        if ((json.orgs ?? []).length > 0) setOrgId(json.orgs[0].id);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load orgs");
      }
    })();
  }, []);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await authedFetch(`/api/tests?orgId=${encodeURIComponent(orgId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load tests");
        setTests(json.tests ?? []);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load tests");
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  const currentOrg = useMemo(() => orgs.find((o) => o.id === orgId) ?? null, [orgId, orgs]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Employer Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {err ? <div className="text-sm text-red-600">{err}</div> : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Organization</div>
              <select
                className="border rounded px-2 py-2 text-sm w-full sm:w-[360px]"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.role})
                  </option>
                ))}
              </select>
              {orgs.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No organizations found for this user. You need an org + membership with EMPLOYER/ADMIN/OWNER.
                </div>
              ) : null}
            </div>

            <Button asChild disabled={!orgId}>
              <Link href={`/corp/employer/tests/new?orgId=${encodeURIComponent(orgId)}`}>Create Test</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tests {currentOrg ? `— ${currentOrg.name}` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}

          {!loading && tests.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tests yet. Create one.</div>
          ) : null}

          <div className="space-y-3">
            {tests.map((t) => (
              <div key={t.id} className="border rounded p-3 flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Window: {fmt(t.starts_at)} → {fmt(t.ends_at)} • Duration:{" "}
                      {Math.round((t.duration_seconds ?? 0) / 60)} min • Mode: {t.distribution} • Q/employee:{" "}
                      {t.per_candidate_count}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="secondary">
                      <Link href={`/corp/employer/tests/${t.id}/pool`}>Pool</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/corp/employer/tests/${t.id}/assign`}>Assign</Link>
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Shuffle questions: {String(t.shuffle_questions)} • Shuffle options: {String(t.shuffle_options)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
