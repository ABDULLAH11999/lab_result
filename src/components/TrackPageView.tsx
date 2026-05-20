"use client";

import { useEffect } from "react";

export default function TrackPageView() {
  useEffect(() => {
    const visitorKey = "labexplain_visitor_id";
    let visitorId = localStorage.getItem(visitorKey);
    const revisited = Boolean(visitorId);

    if (!visitorId) {
      visitorId = `visitor_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
      localStorage.setItem(visitorKey, visitorId);
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        visitorId,
        revisited
      })
    }).catch(() => {});
  }, []);

  return null;
}
