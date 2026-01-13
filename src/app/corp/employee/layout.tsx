// src/app/corp/employee/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/corp/auth/sign-in");

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Corporate Console</div>
            <div className="text-lg font-semibold">Employee</div>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <a className="underline" href="/corp/employee">
              Assignments
            </a>
            <a className="underline" href="/corp/employer">
              Employer
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
