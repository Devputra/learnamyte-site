import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name) {
          return (await cookieStore).get(name)?.value;
        },
        async set(name, value, options) {
          try {
            (await cookieStore).set({ name, value, ...options });
          } catch {
            // Server Components cannot set cookies in Next.js.
            // This is expected during SSR; do not crash the page.
          }
        },
        async remove(name, options) {
          try {
            (await cookieStore).set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Same reason as above.
          }
        },
      },
    },
  );
}
