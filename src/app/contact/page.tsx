"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setLoading(false);

    if (!res.ok) {
      setError("We could not send your message. Please try again.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return <div className="mx-auto max-w-xl px-6 py-24 text-center text-slate-700">Your message was sent. We will get back to you soon.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-syne text-4xl font-bold text-slate-950">Contact</h1>
      <p className="mt-3 text-slate-600">Questions, support, or feedback. We read every message.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
        {[
          ["name", "Your name", "Jane Doe"],
          ["email", "Email address", "jane@example.com"],
          ["subject", "Subject", "Question about my report"]
        ].map(([key, label, placeholder]) => (
          <div key={key}>
            <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
            <input
              required
              value={form[key as keyof typeof form]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder={placeholder}
            />
          </div>
        ))}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-900">Message</label>
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="How can we help?"
          />
        </div>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <button className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white" disabled={loading}>
          {loading ? "Sending..." : "Send message"}
        </button>
      </form>
    </div>
  );
}
