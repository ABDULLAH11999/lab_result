"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FlaskConical, Menu, X } from "lucide-react";

const links = [
  { href: "/analyze", label: "Analyze" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setUser(data.user || null);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600 p-2 text-white">
            <FlaskConical className="size-5" />
          </div>
          <div>
            <div className="font-syne text-lg font-bold text-slate-950">LabExplain</div>
            <div className="text-xs text-slate-500">Plain-English lab explanations</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-slate-600 transition-colors hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {user.role === "superadmin" ? (
                <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-950">
                  Admin
                </Link>
              ) : (
                <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-950">
                  Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-950">
                Log in
              </Link>
              <Link href="/auth/register" className="text-sm font-medium text-slate-600 hover:text-slate-950">
                Sign Up
              </Link>
              <Link href="/analyze" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Try Free
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((current) => !current)} aria-label="Toggle menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm text-slate-700">
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href={user.role === "superadmin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="text-sm text-slate-700">
                  {user.role === "superadmin" ? "Admin" : "Dashboard"}
                </Link>
                <button onClick={handleLogout} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)} className="text-sm text-slate-700">
                  Log in
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)} className="text-sm text-slate-700">
                  Sign Up
                </Link>
                <Link href="/analyze" onClick={() => setOpen(false)} className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white">
                  Try Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
