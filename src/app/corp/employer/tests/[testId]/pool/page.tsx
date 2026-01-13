"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authedFetch } from "@/lib/corp/authedFetch";

type OptionRow = { id: string; option_text: string; option_index: number };
type QuestionRow = {
  id: string;
  text: string;
  marks: number;
  difficulty: number | null;
  tags: string[] | null;
  options: OptionRow[];
  correct_option_ids: string[];
};

export default function PoolBuilderPage() {
  const params = useParams<{ testId: string }>();
  const testId = params.testId;

  const [testTitle, setTestTitle] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // form state
  const [text, setText] = useState("");
  const [marks, setMarks] = useState(1);
  const [difficulty, setDifficulty] = useState<number | "">("");
  const [tags, setTags] = useState<string>("");

  const [opts, setOpts] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const canSubmit = useMemo(() => text.trim() && opts.filter((o) => o.trim()).length >= 2, [text, opts]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await authedFetch(`/api/tests/${testId}/questions`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load pool");
      setTestTitle(json.test?.title ?? "");
      setQuestions(json.questions ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  async function addQuestion() {
    if (!canSubmit) return;

    setLoading(true);
    setErr("");
    try {
      const cleanOptions = opts.map((o) => o.trim()).filter(Boolean);
      const res = await authedFetch(`/api/tests/${testId}/questions`, {
        method: "POST",
        body: JSON.stringify({
          text,
          marks,
          difficulty: difficulty === "" ? null : Number(difficulty),
          tags,
          options: cleanOptions,
          correctIndex: Math.min(correctIndex, cleanOptions.length - 1),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add question");

      setText("");
      setMarks(1);
      setDifficulty("");
      setTags("");
      setOpts(["", "", "", ""]);
      setCorrectIndex(0);

      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to add question");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pool Builder — {testTitle || testId}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/corp/employer">Back</Link>
          </Button>
          <Button asChild>
            <Link href={`/corp/employer/tests/${testId}/assign`}>Next: Assign</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {err ? <div className="text-sm text-red-600">{err}</div> : null}

          <div className="space-y-1">
            <div className="text-sm font-medium">Question</div>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Question text..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Marks</div>
              <Input type="number" min={1} value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Difficulty (optional)</div>
              <Input
                type="number"
                min={1}
                max={5}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Tags (comma separated)</div>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="excel, vlookup, pivot" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Options</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {opts.map((v, i) => (
                <Input
                  key={i}
                  value={v}
                  onChange={(e) => {
                    const next = opts.slice();
                    next[i] = e.target.value;
                    setOpts(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Correct option</div>
              <select
                className="border rounded px-2 py-2 text-sm"
                value={correctIndex}
                onChange={(e) => setCorrectIndex(Number(e.target.value))}
              >
                {[0, 1, 2, 3].map((i) => (
                  <option key={i} value={i}>
                    Option {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={addQuestion} disabled={loading || !canSubmit}>
            {loading ? "Saving..." : "Add to Pool"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pool Questions ({questions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && questions.length === 0 ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
          {questions.map((q, idx) => (
            <div key={q.id} className="border rounded p-3 space-y-2">
              <div className="font-medium">
                {idx + 1}. {q.text} <span className="text-xs text-muted-foreground">(marks: {q.marks})</span>
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {(q.options ?? []).map((o) => {
                  const isCorrect = (q.correct_option_ids ?? []).includes(o.id);
                  return (
                    <li key={o.id} className={isCorrect ? "font-medium" : ""}>
                      {o.option_text} {isCorrect ? "✓" : ""}
                    </li>
                  );
                })}
              </ul>
              {q.tags?.length ? <div className="text-xs text-muted-foreground">Tags: {q.tags.join(", ")}</div> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
