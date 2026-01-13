// src/app/corp/auth/sign-in/page.tsx
"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/corp/employer");
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Corporate Console Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={signIn}>
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in..." : "Sign In"}
            </Button>
            {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
            <p className="text-sm text-muted-foreground">
                New employer? <a className="underline" href="/corp/auth/sign-up">Create an account</a>
              </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
