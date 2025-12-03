// src/app/admin/certificates/new/page.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const COURSE_PRESETS = [
  { courseName: "Data Optimization with Python", courseCode: "DOP" },
  { courseName: "Fundamentals of Quantum Information and Computing", courseCode: "FOQIC" },
  { courseName: "Data Visualization with Power BI", courseCode: "DVPBI" },
  { courseName: "Data Analysis with SQL", courseCode: "DASQL" },
] as const;

export default function NewCertificatePage() {
  const [learnerName, setLearnerName] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    COURSE_PRESETS[0].courseCode,
  );
  const [completedOn, setCompletedOn] = useState("");
  const [certificateId, setCertificateId] = useState("");
  const [adminSecret, setAdminSecret] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    certificateId: string;
    verifyUrl: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const preset = COURSE_PRESETS.find(
      (c) => c.courseCode === selectedCourseCode,
    );

    if (!preset) {
      setLoading(false);
      setError("Invalid course selected.");
      return;
    }

    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({
          learnerName,
          learnerEmail,
          courseName: preset.courseName,
          courseCode: preset.courseCode,
          certificateId: certificateId || undefined, 
          completedOn,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to issue certificate.");
      }

      setSuccess({
        certificateId: data.certificate.certificateId,
        verifyUrl: data.verifyUrl,
      });
      setLearnerName("");
      setLearnerEmail("");
      setCertificateId("");
      setCompletedOn(""); 
      setAdminSecret("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="text-2xl font-bold">Issue new certificate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal dashboard for generating Learnamyte certificates. Keep this
          page private.
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Certificate details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-medium">Learner name</label>
                <Input
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                  required
                  placeholder="Full name as it should appear on certificate"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Learner email (optional but recommended)
                </label>
                <Input
                  type="email"
                  value={learnerEmail}
                  onChange={(e) => setLearnerEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Course</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={selectedCourseCode}
                  onChange={(e) => setSelectedCourseCode(e.target.value)}
                >
                  {COURSE_PRESETS.map((c) => (
                    <option key={c.courseCode} value={c.courseCode}>
                      {c.courseName} ({c.courseCode})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  The certificate ID will be generated using this course code.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Certificate ID (optional)
                </label>
                <Input
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="ABC-DE00-0000-000"
                />
                <p className="text-xs text-muted-foreground">
                  Leave this blank to auto-generate an ID. Enter a value to use a specific ID.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Date of completion
                </label>
                <Input
                  type="date"
                  value={completedOn}
                  onChange={(e) => setCompletedOn(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
              <label className="text-sm font-medium">Admin secret</label>
              <Input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This must match the ADMIN_ISSUE_SECRET on the server.
              </p>
            </div>


              {error && (
                <p className="text-sm text-red-600">
                  <span className="font-semibold">Error:</span> {error}
                </p>
              )}

              {success && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Certificate issued successfully.</span>
                  </div>
                  <div className="mt-1 font-mono text-xs">
                    ID: {success.certificateId}
                  </div>
                  <div className="mt-1 break-all text-xs">
                    Verify URL:{" "}
                    <a
                      href={success.verifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {success.verifyUrl}
                    </a>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={loading} className="mt-4 bg-black text-white hover:bg-[#193BC8]">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Issuing…
                  </>
                ) : (
                  "Issue certificate"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
