// src/app/corp/auth/callback/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code"); // PKCE code

  if (code) {
    const supabase = supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // After confirmation/exchange, send them into Employer area
  return NextResponse.redirect(new URL("/corp/employer", url));
}
