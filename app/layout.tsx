import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "QBank",
  description: "A calm, focused question bank for serious study.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; role: string } | null = null;

  if (user) {
    const { data } = await supabase
      .from("users")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    profile = data;
  }

  return (
    <html lang="en">
      <body>
        <Navbar
          email={user?.email ?? null}
          fullName={profile?.full_name ?? null}
          role={profile?.role ?? null}
        />
        {children}
      </body>
    </html>
  );
}
