// src/app/verify/[token]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getCertificateByToken,
  type CertificateRecord,
} from "@/lib/certificates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type RouteParams = {
  token: string;
};

// In Next 15, params is a Promise
type VerifyPageProps = {
  params: Promise<RouteParams>;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* --------- Metadata --------- */

export async function generateMetadata(
  props: VerifyPageProps,
): Promise<Metadata> {
  const { token } = await props.params;

  return {
    title: "Certificate Verification • Learnamyte",
    description: `Verify a Learnamyte certificate using token ${token}`,
  };
}

/* --------------------- Page UI --------------------- */

export default async function VerifyPage(props: VerifyPageProps) {
  const { token } = await props.params;

  console.log("[verify] token param:", token);

  const cert: CertificateRecord | null = await getCertificateByToken(token);

  /* --------- Not Found UI --------- */
  if (!cert) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full border-red-200">
          <CardHeader className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <CardTitle>Certificate not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              We couldn&apos;t find a certificate for this verification link.
              The ID may be incorrect, expired, or revoked.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Learnamyte
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isActive = cert.status === "valid";

  /* --------- Valid Certificate UI --------- */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        
        {/* Top bar */}
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-primary"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-white text-sm font-bold">
              L
            </span>
            <span>Learnamyte</span>
          </Link>

          <Button variant="outline" size="sm" asChild>
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to homepage
            </Link>
          </Button>
        </header>

        {/* Verification card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {isActive ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <CardTitle>Valid Learnamyte certificate</CardTitle>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <CardTitle>Certificate not active</CardTitle>
                </>
              )}
            </div>

            <div className="text-xs font-mono text-muted-foreground">
              ID:&nbsp;{cert.certificateId}
            </div>
          </CardHeader>

          <CardContent className="space-y-6 text-sm">
            
            {/* Info Grid */}
            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Learner
                </p>
                <p className="mt-1 text-base font-medium">{cert.learnerName}</p>
                {cert.learnerEmail && (
                  <p className="text-xs text-muted-foreground">
                    {cert.learnerEmail}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Course
                </p>
                <p className="mt-1 text-base font-medium">{cert.courseName}</p>
                <p className="text-xs text-muted-foreground">
                  Code: {cert.courseCode}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Date of completion
                </p>
                <p className="mt-1">{formatDate(cert.completedOn)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Verification status
                </p>
                <p className="mt-1">
                  {isActive ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Verified • Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Not active / Revoked
                    </span>
                  )}
                </p>
              </div>
            </section>

            {/* Footer */}
            <section className="border-t pt-4 text-xs text-muted-foreground">
              <p>
                This page confirms that the above learner has been issued a
                certificate by Learnamyte for successfully completing the
                mentioned course. If you suspect tampering, please contact{" "}
                <a
                  href="mailto:team@learnamyte.com"
                  className="underline"
                >
                  team@learnamyte.com
                </a>
                .
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </main>
  );
}
