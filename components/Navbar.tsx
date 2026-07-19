"use client";

import { useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = Boolean(email);
  const isAdmin = role === "admin";
  const displayName = fullName || email;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/#features", label: "Features" },
    { href: "/#about", label: "About" },
    ...(isLoggedIn
      ? [
          { href: "/search", label: "Search" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/quiz/new", label: "New Quiz" },
        ]
      : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel" }] : []),
  ];

  return (
    <header className="relative border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-semibold text-white">
            Q
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            QBank
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-primary-700">
              {link.label}
            </a>
          ))}

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="max-w-[8rem] truncate text-slate-500">{displayName}</span>
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

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-2 border-t border-slate-100 pt-3">
            {isLoggedIn ? (
              <div className="flex items-center justify-between px-3">
                <span className="truncate text-sm text-slate-500">{displayName}</span>
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
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg bg-primary-600 px-3 py-2.5 text-center text-sm font-medium text-white transition hover:bg-primary-700"
              >
                Sign in
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
