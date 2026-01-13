// src/lib/corp/authedFetch.ts
"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const supabase = supabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(input, { ...init, headers });
  return res;
}
