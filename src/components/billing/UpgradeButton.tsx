"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface UpgradeButtonProps {
  authenticated: boolean;
  className?: string;
  children: ReactNode;
}

export default function UpgradeButton({ authenticated, className, children }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const raw = await response.text();
      let data: { url?: string; error?: string } = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Stripe checkout could not be started. Please check Stripe settings and try again.");
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Stripe checkout could not be started.");
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <Link href="/auth/signup?plan=pro" className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleUpgrade} disabled={loading} className={className}>
      {loading ? "Redirecting..." : children}
    </button>
  );
}
