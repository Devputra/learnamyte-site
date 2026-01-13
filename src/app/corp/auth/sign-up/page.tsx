// src/app/corp/auth/sign-up/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const supabase = supabaseBrowser();

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${baseUrl.replace(/\/$/, "")}/corp/auth/callback`,
      },
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    // If Confirm Email is ON, session will be null and user must click the email link.
    if (!data.session) {
      setMsg("Check your inbox to confirm your email, then come back and sign in.");
      return;
    }

    router.push("/corp/employer");
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Employer Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={signUp}>
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating..." : "Create account"}
            </Button>

            {msg ? <p className="text-sm text-red-600">{msg}</p> : null}

            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link className="underline" href="/corp/auth/sign-in">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
