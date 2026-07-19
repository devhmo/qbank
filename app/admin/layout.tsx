import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // The middleware (lib/supabase/middleware.ts) already blocks non-admins
  // from reaching here — this check is a second, independent guard in case
  // a route is ever added under /admin that the middleware matcher misses.
  if (profile?.role !== "admin") {
    redirect("/login?redirectTo=/admin");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AdminNav />
      {children}
    </div>
  );
}
