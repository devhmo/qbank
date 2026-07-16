import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/health
//
// A lightweight diagnostic endpoint to confirm the app can reach Supabase
// with the configured NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
// It reads from `public.subjects`, a table anyone signed in can SELECT from
// (see the RLS policies in supabase/migrations). An empty table still
// counts as "connected" — we only care whether the request succeeds.
export async function GET() {
  const { error, status } = await supabase
    .from("subjects")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      {
        connected: false,
        status,
        error: error.message,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    connected: true,
    message: "Successfully reached Supabase.",
  });
}
