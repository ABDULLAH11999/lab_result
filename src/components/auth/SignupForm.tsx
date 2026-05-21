"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignupForm({ initialPlan = "free" }: { initialPlan?: "free" | "pro" }) {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">(initialPlan);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", otp: "" });
  const router = useRouter();

  async function redirectToCheckout() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Stripe checkout could not be started.");
    }

    window.location.href = data.url;
  }

  async function startSignup(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not start signup.");
        return;
      }

      if (data.directLogin) {
        window.dispatchEvent(new Event("auth-change"));
        if (selectedPlan === "pro") {
          await redirectToCheckout();
        } else {
          router.push("/dashboard");
        }
        return;
      }

      setOtpHint(data.previewCode ? `Development code: ${data.previewCode}` : "Check your email for the code.");
      setStep("otp");
    } catch {
      setError("Signup could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code.");
        return;
      }

      window.dispatchEvent(new Event("auth-change"));
      if (selectedPlan === "pro") {
        await redirectToCheckout();
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Verification could not connect. Please try again.");
      toast.error("Stripe checkout could not be started.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-syne text-3xl font-bold text-slate-950 sm:text-4xl">Create your account</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">OTP is used once at signup. After verification, future sign-ins use email and password only.</p>
      <form onSubmit={step === "form" ? startSignup : verifyOtp} className="mt-6 space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 sm:mt-8 sm:rounded-[28px] sm:p-6">
        {step === "form" ? (
          <>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value as "free" | "pro")}>
              <option value="free">Start on Free</option>
              <option value="pro">I want Pro access</option>
            </select>
          </>
        ) : (
          <>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="6-digit code" value={form.otp} onChange={(event) => setForm({ ...form, otp: event.target.value })} />
            <p className="text-sm text-slate-500">{otpHint}</p>
          </>
        )}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <button className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white sm:w-auto" disabled={loading}>
          {loading ? "Please wait..." : step === "form" ? "Send verification code" : "Verify and continue"}
        </button>
      </form>
    </div>
  );
}
