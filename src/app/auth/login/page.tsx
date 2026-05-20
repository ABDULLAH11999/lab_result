"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Invalid login.");
      return;
    }

    router.push(data.user?.role === "superadmin" ? "/admin" : "/dashboard");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-syne text-3xl font-bold text-slate-950 sm:text-4xl">Log in</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">No OTP needed after your first verified signup.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 sm:mt-8 sm:rounded-[28px] sm:p-6">
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <button className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white sm:w-auto" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
        <p className="text-sm text-slate-600">
          Need an account?{" "}
          <Link href="/auth/register" className="font-semibold text-blue-700 hover:underline">
            Sign up here
          </Link>
        </p>
      </form>
    </div>
  );
}
