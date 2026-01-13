// src/app/corp/employee/results/[attemptId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AttemptResultPayload = {
  test?: {
    title: string;
    show_score_to_employee?: boolean | null;
  };
  attempt?: {
    status: string;
    submitted_at?: string | null;
  };
  result?: {
    total_score?: number;
    percent?: number;
    passed?: boolean;
  };
};

export default function ResultPage({ params }: { params: { attemptId: string } }) {
  const router = useRouter();
  const attemptId = params.attemptId;

  const [data, setData] = useState<AttemptResultPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr(null);
        const res = await fetch(`/api/attempts/${attemptId}`, { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as AttemptResultPayload;

        if (!res.ok) throw new Error((json as any)?.error ?? `Failed to load result (${res.status})`);

        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load result");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  if (err) {
    return <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>;
  }
  if (!data) return <div className="text-sm text-gray-500">Loading result…</div>;

  const canShowScore = !!data.test?.show_score_to_employee;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Result</h1>
        <div className="text-sm text-gray-600">{data.test?.title ?? "Assessment"}</div>
      </div>

      <div className="rounded border p-4">
        <div className="text-sm text-gray-600">Attempt</div>
        <div className="font-mono text-sm">{attemptId}</div>
        <div className="mt-2 text-sm">
          Status: <span className="rounded bg-gray-100 px-2 py-1 text-xs">{data.attempt?.status ?? "—"}</span>
        </div>

        {canShowScore ? (
          <div className="mt-4 space-y-1">
            <div className="text-sm">
              Score: <span className="font-semibold">{data.result?.total_score ?? "—"}</span>
            </div>
            <div className="text-sm">
              Percentage: <span className="font-semibold">{data.result?.percent ?? "—"}%</span>
            </div>
            <div className="text-sm">
              Outcome:{" "}
              <span className={`font-semibold ${data.result?.passed ? "text-green-700" : "text-red-700"}`}>
                {data.result?.passed ? "PASS" : "FAIL"}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-600">
            Your employer has disabled score visibility. Your submission has been recorded.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button className="rounded border px-4 py-2" onClick={() => router.push("/corp/employee")}>
          Back to Assignments
        </button>
      </div>
    </div>
  );
}
