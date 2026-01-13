"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authedFetch } from "@/lib/corp/authedFetch";

export default function AssignPage() {
  const params = useParams<{ testId: string }>();
  const testId = params.testId;

  const [title, setTitle] = useState("");
  const [emails, setEmails] = useState("");
  const [reminderCutoffHours, setReminderCutoffHours] = useState(24);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<any>(null);

  async function loadMeta() {
    setErr("");
    try {
      const res = await authedFetch(`/api/tests/${testId}/questions`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load test");
      setTitle(json.test?.title ?? "");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load test");
    }
  }

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  async function assign() {
    setLoading(true);
    setErr("");
    setResult(null);
    try {
      const res = await authedFetch(`/api/tests/${testId}/assign`, {
        method: "POST",
        body: JSON.stringify({ emails, reminderCutoffHours }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Assign failed");
      setResult(json);
    } catch (e: any) {
      setErr(e?.message ?? "Assign failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Assign — {title || testId}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/corp/employer/tests/${testId}/pool`}>Back to Pool</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/corp/employer">Dashboard</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {err ? <div className="text-sm text-red-600">{err}</div> : null}

          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={`Paste emails (one per line)\nuser1@company.com\nuser2@company.com`}
            rows={8}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Reminder cutoff (hours before end)</div>
              <Input
                type="number"
                min={0}
                value={reminderCutoffHours}
                onChange={(e) => setReminderCutoffHours(Number(e.target.value))}
              />
              <div className="text-xs text-muted-foreground">
                Scheduler will remind NOT_STARTED employees when now ≥ reminder_cutoff_at.
              </div>
            </div>
          </div>

          <Button onClick={assign} disabled={loading}>
            {loading ? "Assigning..." : "Assign Test"}
          </Button>

          {result ? (
            <div className="border rounded p-3 text-sm space-y-2">
              <div className="font-medium">Assignment Result</div>
              <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
