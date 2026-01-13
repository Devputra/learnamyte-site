// src/app/corp/employee/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TestRow = {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  duration_seconds: number | null;
  show_score_to_employee?: boolean | null;
};

type AssignmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | string;

type AssignmentRow = {
  id: string;
  status: AssignmentStatus;
  test_id: string;
  created_at?: string;
  tests: TestRow | TestRow[]; // robust to Supabase nested typing
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function safeTime(ms: number | null) {
  if (ms === null) return null;
  return Number.isFinite(ms) ? ms : null;
}

function parseDateMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return safeTime(ms);
}

function formatWindow(startsAt?: string | null, endsAt?: string | null) {
  if (!startsAt && !endsAt) return "No time window";

  const sMs = parseDateMs(startsAt);
  const eMs = parseDateMs(endsAt);

  const s = sMs !== null ? new Date(sMs).toLocaleString() : "—";
  const e = eMs !== null ? new Date(eMs).toLocaleString() : "—";

  return `${s} → ${e}`;
}

function statusLabel(status: AssignmentStatus) {
  switch (status) {
    case "NOT_STARTED":
      return "NOT_STARTED";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "SUBMITTED":
      return "SUBMITTED";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return status || "UNKNOWN";
  }
}

export default function EmployeeAssignmentsPage() {
  const router = useRouter();

  const [rows, setRows] = useState<AssignmentRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Track which assignment is being started/resumed (prevents double-click issues)
  const [startingId, setStartingId] = useState<string | null>(null);

  // IMPORTANT FIX: keep "now" fresh so window logic updates while page is open.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000); // refresh every 15s
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setErr(null);
        setRows(null);

        const res = await fetch("/api/me/assignments", {
          method: "GET",
          signal: ac.signal,
          // browser fetch; keep for clarity
          cache: "no-store",
          headers: { accept: "application/json" },
        });

        const json = await res
          .json()
          .catch(() => ({} as { assignments?: AssignmentRow[]; error?: string }));

        if (!res.ok) {
          throw new Error(json?.error ?? `Failed to load assignments (${res.status})`);
        }

        setRows(Array.isArray(json?.assignments) ? json.assignments : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message ?? "Failed to load assignments");
        setRows([]); // show empty state + error instead of infinite loading
      }
    })();

    return () => ac.abort();
  }, []);

  async function startOrResume(assignmentId: string) {
    if (startingId) return; // prevent parallel starts
    setStartingId(assignmentId);
    setErr(null);

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/start`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error ?? `Start failed (${res.status})`);

      // Accept multiple possible response shapes.
      const attemptId: string | undefined = json.attemptId ?? json.attempt_id ?? json.id;
      if (!attemptId) throw new Error("Start succeeded but attempt id was not returned.");

      router.push(`/corp/employee/attempts/${attemptId}`);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to start attempt");
    } finally {
      setStartingId(null);
    }
  }

  const hasRows = useMemo(() => Array.isArray(rows), [rows]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Your Assignments</h1>
        <p className="text-sm text-gray-600">
          Start within the allowed window. If you&apos;ve already started, you can resume even if the window has ended.
        </p>
      </div>

      {err && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {err}
        </div>
      )}

      {!hasRows ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : rows!.length === 0 ? (
        <div className="rounded border p-4 text-sm text-gray-600">No assignments found.</div>
      ) : (
        <div className="overflow-hidden rounded border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Test</th>
                <th className="px-3 py-2">Window</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 w-44"></th>
              </tr>
            </thead>

            <tbody>
              {rows!.map((a) => {
                const t = one(a.tests);
                const startsAtMs = parseDateMs(t?.starts_at);
                const endsAtMs = parseDateMs(t?.ends_at);

                const inWindow =
                  (startsAtMs === null || now >= startsAtMs) &&
                  (endsAtMs === null || now <= endsAtMs);

                const status = a.status ?? "NOT_STARTED";
                const isSubmitted = status === "SUBMITTED";
                const isExpired = status === "EXPIRED";
                const isInProgress = status === "IN_PROGRESS";

                // KEY FIX: allow resume when IN_PROGRESS even if window ended.
                const canStartOrResume =
                  !isSubmitted &&
                  !isExpired &&
                  (isInProgress || inWindow);

                const buttonText =
                  startingId === a.id ? "Starting…" : canStartOrResume ? "Start / Resume" : "Unavailable";

                return (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{t?.title ?? "Untitled test"}</div>
                      <div className="text-xs text-gray-500">Assignment: {a.id}</div>
                    </td>

                    <td className="px-3 py-2 text-gray-700">
                      <div>{formatWindow(t?.starts_at, t?.ends_at)}</div>
                      {!inWindow && !isInProgress && !isSubmitted && !isExpired && (
                        <div className="mt-1 text-xs text-gray-500">Not currently within the allowed window.</div>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {statusLabel(status)}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-right">
                      <button
                        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                        disabled={!canStartOrResume || startingId === a.id}
                        onClick={() => startOrResume(a.id)}
                      >
                        {buttonText}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
