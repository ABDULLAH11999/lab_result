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
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-syne text-4xl font-bold text-slate-950">Log in</h1>
      <p className="mt-3 text-slate-600">No OTP needed after your first verified signup.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <button className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white" disabled={loading}>
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
