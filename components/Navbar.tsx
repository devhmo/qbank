"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar({
  email,
  fullName,
  role,
}: {
  email: string | null;
  fullName: string | null;
  role: string | null;
}) {
  const router = useRouter();
  const isLoggedIn = Boolean(email);
  const isAdmin = role === "admin";
  const displayName = fullName || email;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-semibold text-white">
            Q
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            QBank
          </span>
        </a>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="/#features" className="transition hover:text-primary-700">
            Features
          </a>
          <a href="/#about" className="transition hover:text-primary-700">
            About
          </a>

          {isLoggedIn && (
            <a href="/dashboard" className="transition hover:text-primary-700">
              Dashboard
            </a>
          )}

          {isLoggedIn && (
            <a href="/quiz/new" className="transition hover:text-primary-700">
              New Quiz
            </a>
          )}

          {isAdmin && (
            <a
              href="/admin"
              className="transition hover:text-primary-700"
            >
              Admin Panel
            </a>
          )}

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="max-w-[10rem] truncate text-slate-500">
                {displayName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Log out
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              Sign in
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
