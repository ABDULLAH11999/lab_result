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
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Stripe checkout could not be started.");
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
