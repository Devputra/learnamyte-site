// src/app/corp/employer/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/corp/auth/sign-in");
        return;
      }
      setReady(true);
    })();
  }, [router, pathname]);

  if (!ready) return null;

  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <div className="font-semibold">Employer Console</div>
          <nav className="flex gap-4 text-sm">
            <Link href="/corp/employer">Dashboard</Link>
            <Link href="/corp/employer/tests/new">Create Test</Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-5xl p-4">{children}</div>
    </div>
  );
}
