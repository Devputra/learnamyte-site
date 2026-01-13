"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authedFetch } from "@/lib/corp/authedFetch";

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewTestPage() {
  const router = useRouter();
  const search = useSearchParams();
  const orgId = search.get("orgId") ?? "";

  const now = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => toLocalInputValue(now), [now]);
  const defaultEnd = useMemo(() => {
    const d = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    return toLocalInputValue(d);
  }, [now]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);

  const [durationMinutes, setDurationMinutes] = useState(30);
  const [perCandidateCount, setPerCandidateCount] = useState(10);

  const [distribution, setDistribution] = useState<"AUTO" | "RANDOM_SUBSET" | "SAME_SET_SHUFFLED">("AUTO");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  const [passPercent, setPassPercent] = useState(60);
  const [showScoreToEmployee, setShowScoreToEmployee] = useState(true);
  const [showCorrectAfterSubmit, setShowCorrectAfterSubmit] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  async function onCreate() {
    setErr("");
    if (!orgId) return setErr("Missing orgId in URL.");
    if (!title.trim()) return setErr("Title is required.");

    setLoading(true);
    try {
      const res = await authedFetch("/api/tests", {
        method: "POST",
        body: JSON.stringify({
          orgId,
          title,
          description,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          durationSeconds: Math.max(60, Math.round(durationMinutes * 60)),
          perCandidateCount: Math.max(1, Math.round(perCandidateCount)),
          distribution,
          shuffleQuestions,
          shuffleOptions,
          passPercent,
          showScoreToEmployee,
          showCorrectAfterSubmit,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed");
      router.push(`/corp/employer/tests/${json.id}/pool`);
    } catch (e: any) {
      setErr(e?.message ?? "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {err ? <div className="text-sm text-red-600">{err}</div> : null}

          <div className="space-y-1">
            <div className="text-sm font-medium">Title</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Excel Screening Test" />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Description</div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Starts at</div>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Ends at</div>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Duration (minutes)</div>
              <Input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Questions per employee</div>
              <Input
                type="number"
                min={1}
                value={perCandidateCount}
                onChange={(e) => setPerCandidateCount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Distribution</div>
              <select
                className="border rounded px-2 py-2 text-sm w-full"
                value={distribution}
                onChange={(e) => setDistribution(e.target.value as any)}
              >
                <option value="AUTO">AUTO</option>
                <option value="RANDOM_SUBSET">RANDOM_SUBSET</option>
                <option value="SAME_SET_SHUFFLED">SAME_SET_SHUFFLED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
              Shuffle questions
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
              Shuffle options
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showScoreToEmployee} onChange={(e) => setShowScoreToEmployee(e.target.checked)} />
              Show score to employee
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Pass %</div>
              <Input type="number" min={0} max={100} value={passPercent} onChange={(e) => setPassPercent(Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-2 text-sm mt-7">
              <input type="checkbox" checked={showCorrectAfterSubmit} onChange={(e) => setShowCorrectAfterSubmit(e.target.checked)} />
              Show correct answers after submit
            </label>
          </div>

          <Button onClick={onCreate} disabled={loading}>
            {loading ? "Creating..." : "Create & Build Pool"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
