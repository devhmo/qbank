import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

// Use inside Server Components, Route Handlers, and Server Actions.
// Reads the session from request cookies so server-rendered pages know who
// is logged in without an extra client-side round trip.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `set` is called from a Server Component during rendering,
            // where cookies can't be written. This is safe to ignore as
            // long as the middleware is refreshing sessions (see
            // lib/supabase/middleware.ts), which it does.
          }
        },
      },
    }
  );
}
