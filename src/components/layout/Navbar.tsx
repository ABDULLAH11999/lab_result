"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, FlaskConical, LayoutDashboard, LogOut, Menu, Sparkles, X } from "lucide-react";

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
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
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
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="icon-float rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-2 text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)]">
            <FlaskConical className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-syne text-base font-bold text-slate-950 sm:text-lg">LabExplain</div>
            <div className="truncate text-[11px] text-slate-500 sm:text-xs">Plain-English lab explanations</div>
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
                <Link href="/admin" className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur hover:text-slate-950">
                  <LayoutDashboard className="size-4" />
                  Admin
                </Link>
              ) : (
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur hover:text-slate-950">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              )}
              <Link href="/analyze" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)] transition-transform duration-200 hover:-translate-y-0.5">
                <Sparkles className="size-4" />
                Analyze
              </Link>
              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur hover:bg-white">
                <LogOut className="size-4" />
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
              <Link href="/analyze" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)] transition-transform duration-200 hover:-translate-y-0.5">
                Try Free
                <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </div>

        <button className="rounded-xl p-2 md:hidden" onClick={() => setOpen((current) => !current)} aria-label="Toggle menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/60 bg-white/80 px-4 py-4 backdrop-blur md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm text-slate-700">
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href={user.role === "superadmin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <LayoutDashboard className="size-4" />
                  {user.role === "superadmin" ? "Admin" : "Dashboard"}
                </Link>
                <Link href="/analyze" onClick={() => setOpen(false)} className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-center text-sm font-semibold text-white">
                  Analyze
                </Link>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <LogOut className="size-4" />
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
                <Link href="/analyze" onClick={() => setOpen(false)} className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-center text-sm font-semibold text-white">
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
