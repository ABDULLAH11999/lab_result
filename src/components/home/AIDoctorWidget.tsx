"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Stethoscope, X } from "lucide-react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export default function AIDoctorWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [cta, setCta] = useState<{ label: string; href: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello, I'm your AI Doctor helper. Ask me about lab reports, symptoms, test values, or what to discuss with your doctor."
    }
  ]);
  const [quotaText, setQuotaText] = useState("Guest: 3 chats/day. Free: 5/day. Pro: unlimited.");
  const [locked, setLocked] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, open]);

  const canSend = useMemo(() => input.trim().length > 1 && !loading && !locked, [input, loading, locked]);

  async function submitMessage() {
    if (!canSend) return;
    const outgoing = input.trim();
    setInput("");
    setLoading(true);
    setCta(null);
    setMessages((current) => [...current, { role: "user", content: outgoing }]);

    try {
      const history = messages.slice(-6);
      const res = await fetch("/api/doctor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: outgoing, history })
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setLocked(true);
          setQuotaText(data.message || "Daily chat limit reached.");
          setCta(
            data.ctaLabel && data.ctaHref
              ? { label: data.ctaLabel, href: data.ctaHref }
              : { label: "See pricing", href: "/pricing" }
          );
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content: data.message || "Daily chat limit reached."
            }
          ]);
          return;
        }

        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: data.error || "I could not answer that right now. Please try again."
          }
        ]);
        return;
      }

      if (typeof data.remaining === "number") {
        setQuotaText(
          data.remaining > 900
            ? "Pro plan: unlimited AI Doctor chats."
            : `${data.remaining} AI Doctor chat${data.remaining === 1 ? "" : "s"} remaining today.`
        );
      }

      if (data.ctaLabel && data.ctaHref) {
        setCta({ label: data.ctaLabel, href: data.ctaHref });
      }

      setMessages((current) => [...current, { role: "assistant", content: data.reply || "Please try again." }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I could not connect right now. Please try again in a moment, or analyze your report directly."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open ? (
        <div className="pointer-events-auto fixed bottom-20 left-4 right-4 z-40 w-auto max-w-[360px] mx-auto sm:bottom-20 sm:left-auto sm:right-20 sm:w-[360px] sm:max-w-none lg:bottom-16 lg:left-6 lg:right-20 lg:w-auto lg:max-w-[760px] lg:ml-auto">
          <div className="absolute bottom-[-8px] right-7 h-5 w-5 rotate-45 border-b border-r border-white/80 bg-white/90 sm:right-10 lg:bottom-5 lg:right-[-10px] lg:border-b-0 lg:border-r lg:border-t" />
          
          <div className="relative flex max-h-[calc(100vh_-_120px)] flex-col overflow-hidden rounded-[34px] border border-white/80 bg-white/92 shadow-[0_28px_80px_rgba(15,23,42,0.20)] backdrop-blur-2xl sm:max-h-[calc(100vh_-_140px)] lg:max-h-[calc(100vh_-_100px)]">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -left-10 bottom-8 h-36 w-36 rounded-full bg-blue-500/15 blur-3xl" />

            <div className="relative border-b border-slate-200/80 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 p-2.5 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]">
                    <Stethoscope className="size-5" />
                  </div>
                  <div>
                    <p className="font-syne text-lg font-bold text-slate-950">AI Doctor</p>
                    <p className="text-xs text-slate-500">Medical questions only</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-200 bg-white/70 p-2 text-slate-500 transition hover:text-slate-900"
                  aria-label="Close AI Doctor"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div ref={scrollerRef} className="relative flex flex-1 min-h-[120px] flex-col gap-3 overflow-y-auto px-4 py-4 max-h-[280px] sm:max-h-[360px] lg:max-h-[460px]">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === "assistant"
                      ? "self-start rounded-bl-md border border-slate-200 bg-white text-slate-700"
                      : "self-end rounded-br-md bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {loading ? (
                <div className="self-start rounded-[22px] rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200/80 px-4 py-4">
              <p className="mb-3 text-[11px] leading-5 text-slate-500">{quotaText}</p>
              {cta ? (
                <Link
                  href={cta.href}
                  className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <Sparkles className="size-3.5" />
                  {cta.label}
                </Link>
              ) : null}
              <div className="flex items-end gap-2 sm:gap-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitMessage();
                    }
                  }}
                  disabled={locked}
                  rows={2}
                  placeholder="Ask about symptoms, labs, reports, or doctor questions..."
                  className="min-h-[54px] flex-1 resize-none rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 lg:min-h-[64px]"
                />
                <button
                  type="button"
                  onClick={() => void submitMessage()}
                  disabled={!canSend}
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] transition disabled:opacity-50"
                >
                  <Send className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-slate-400">Educational only. This is not medical advice.</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed bottom-3 right-2 z-40 block sm:bottom-4 sm:right-3 lg:bottom-5 lg:right-5">
        <div className="pointer-events-auto flex items-end justify-end">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="group relative bg-transparent pr-1 pb-1 sm:pr-0 sm:pb-0"
            aria-label="Open AI Doctor"
          >
            {!open ? (
              <div className="absolute bottom-[34px] right-[72px] w-[168px] max-w-[calc(100vw_-_96px)] rounded-[24px] border border-white/80 bg-white/92 px-3 py-2.5 text-left text-[12px] leading-5 text-slate-700 shadow-[0_20px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:bottom-[34px] sm:right-[96px] sm:max-w-none sm:w-[192px] sm:text-sm lg:bottom-[50px] lg:right-[136px] lg:w-[240px]">
                Ask about lab values, symptoms, or what to discuss with your doctor.
              </div>
            ) : null}

            <div className="absolute inset-x-3 bottom-4 top-5 rounded-[40px] bg-cyan-300/20 blur-2xl transition duration-300 group-hover:bg-cyan-300/30" />
            <div className="relative px-2 pt-2">
              <Image
                src="/doctor-chat.png"
                alt="AI Doctor"
                width={140}
                height={160}
                className="h-[96px] w-[72px] object-contain sm:h-[128px] sm:w-[96px] lg:h-[176px] lg:w-[132px]"
                priority={false}
              />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
