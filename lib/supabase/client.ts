import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Use inside Client Components. Session is stored in cookies (not just
// localStorage), so both the browser and the server can read it — this is
// what makes the session persist across full navigations and page reloads.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
