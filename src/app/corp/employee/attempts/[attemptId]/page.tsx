"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AttemptApi = {
  attempt: {
    id: string;
    title?: string | null;
    startedAt?: string | null;
    endsAt?: string | null;
    submittedAt?: string | null;

    // In case older snake_case still exists somewhere in your API response
    started_at?: string | null;
    ends_at?: string | null;
    submitted_at?: string | null;
  };
  questions: Array<{
    id: string;
    text?: string | null;
    prompt?: string | null;
    marks?: number | null;
    options: Array<{
      id: string;
      // Support both column naming variants safely
      option_text?: string | null;
      text?: string | null;
    }>;
  }>;
};

type AnswersApi = {
  answers: Array<{
    question_id: string;
    selected_option_ids: string[];
  }>;
};

function isoToMs(v?: string | null) {
  if (!v) return null;
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? ms : null;
}

function fmtRemaining(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function AttemptPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttemptApi | null>(null);

  // answersByQuestionId[qid] = [optionId]
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, string[]>>({});
  const [savingQ, setSavingQ] = useState<Record<string, boolean>>({});
  const [submitBusy, setSubmitBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer
  const [nowMs, setNowMs] = useState(() => Date.now());
  const autoSubmitOnceRef = useRef(false);

  // Per-question debounce timers
  const debounceRef = useRef<Record<string, any>>({});

  const attempt = data?.attempt;
  const endsAtMs = useMemo(() => {
    return (
      isoToMs(attempt?.endsAt) ??
      isoToMs(attempt?.ends_at) ??
      null
    );
  }, [attempt?.endsAt, attempt?.ends_at]);

  const submittedAtMs = useMemo(() => {
    return (
      isoToMs(attempt?.submittedAt) ??
      isoToMs(attempt?.submitted_at) ??
      null
    );
  }, [attempt?.submittedAt, attempt?.submitted_at]);

  const remainingSeconds = useMemo(() => {
    if (!endsAtMs) return null;
    return Math.floor((endsAtMs - nowMs) / 1000);
  }, [endsAtMs, nowMs]);

  // Load attempt + questions
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [attemptRes, answersRes] = await Promise.all([
          fetch(`/api/attempts/${attemptId}`, { cache: "no-store" }),
          fetch(`/api/attempts/${attemptId}/answers`, { cache: "no-store" }),
        ]);

        if (!attemptRes.ok) {
          const t = await attemptRes.text();
          throw new Error(`Failed to load attempt: ${attemptRes.status} ${t}`);
        }

        const attemptJson = (await attemptRes.json()) as AttemptApi;

        // answers endpoint may not exist yet; we’re adding it below
        let answersJson: AnswersApi | null = null;
        if (answersRes.ok) {
          answersJson = (await answersRes.json()) as AnswersApi;
        }

        if (!alive) return;

        setData(attemptJson);

        if (answersJson?.answers?.length) {
          const map: Record<string, string[]> = {};
          for (const a of answersJson.answers) map[a.question_id] = a.selected_option_ids ?? [];
          setAnswersByQuestionId(map);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Unknown error");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [attemptId]);

  // Tick timer
  useEffect(() => {
    if (!endsAtMs || submittedAtMs) return;

    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAtMs, submittedAtMs]);

  // Auto-submit when timer hits zero
  useEffect(() => {
    if (submittedAtMs) return;
    if (remainingSeconds == null) return;
    if (remainingSeconds > 0) return;
    if (autoSubmitOnceRef.current) return;

    autoSubmitOnceRef.current = true;
    void submitAttempt(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, submittedAtMs]);

  async function saveAnswer(questionId: string, selectedOptionIds: string[]) {
    setSavingQ((s) => ({ ...s, [questionId]: true }));
    try {
      const res = await fetch(`/api/attempts/${attemptId}/answers`, {
        method: "PUT", // IMPORTANT: matches your existing API
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOptionIds }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Save failed (${res.status})`);
      }
    } finally {
      setSavingQ((s) => ({ ...s, [questionId]: false }));
    }
  }

  function scheduleSave(questionId: string, selectedOptionIds: string[]) {
    // Debounce per-question so rapid clicking doesn’t spam API
    if (debounceRef.current[questionId]) clearTimeout(debounceRef.current[questionId]);

    debounceRef.current[questionId] = setTimeout(() => {
      void saveAnswer(questionId, selectedOptionIds);
    }, 250);
  }

  async function submitAttempt(isAuto = false) {
    if (submitBusy) return;

    setSubmitBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Submit failed (${res.status})`);
      }

      // Navigate to result page
      router.push(`/corp/employee/results/${attemptId}`);
      router.refresh();
    } catch (e: any) {
      // If auto-submit fails, we still show error but avoid infinite loop
      setError(`${isAuto ? "Auto-submit" : "Submit"} error: ${e?.message ?? "Unknown error"}`);
    } finally {
      setSubmitBusy(false);
    }
  }

  if (loading) return <div className="p-6">Loading attempt…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">No attempt found.</div>;

  const title = attempt?.title ?? "Assessment";
  const locked = Boolean(submittedAtMs) || (remainingSeconds != null && remainingSeconds <= 0);

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="mt-1 text-sm text-neutral-600">
            {submittedAtMs ? "Submitted" : locked ? "Time expired" : "In progress"}
          </div>
        </div>

        {endsAtMs && !submittedAtMs && (
          <div className="rounded border px-3 py-2 text-right">
            <div className="text-xs text-neutral-600">Time left</div>
            <div className="text-lg font-semibold">
              {remainingSeconds == null ? "--:--" : fmtRemaining(remainingSeconds)}
            </div>
            {remainingSeconds != null && remainingSeconds <= 60 && remainingSeconds > 0 && (
              <div className="text-xs text-red-600">Less than 1 minute</div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {data.questions.map((q, idx) => {
          const qText = q.text ?? q.prompt ?? "";
          const selected = answersByQuestionId[q.id] ?? [];
          const saving = savingQ[q.id] ?? false;

          return (
            <div key={q.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium">
                  {idx + 1}. {qText}
                </div>
                <div className="text-xs text-neutral-500">
                  {saving ? "Saving…" : q.marks != null ? `${q.marks} marks` : ""}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {q.options.map((opt) => {
                  const label = opt.option_text ?? opt.text ?? "";
                  const checked = selected.includes(opt.id);

                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 hover:bg-neutral-50 ${
                        checked ? "border-black" : "border-neutral-200"
                      } ${locked ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={checked}
                        disabled={locked}
                        onChange={() => {
                          const next = [opt.id];
                          setAnswersByQuestionId((m) => ({ ...m, [q.id]: next }));
                          scheduleSave(q.id, next);
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          className="rounded border px-4 py-2 hover:bg-neutral-50"
          onClick={() => router.push("/corp/employee")}
        >
          Back
        </button>

        <button
          className="rounded bg-black px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-60"
          disabled={submitBusy || Boolean(submittedAtMs)}
          onClick={() => submitAttempt(false)}
        >
          {submittedAtMs ? "Submitted" : submitBusy ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
