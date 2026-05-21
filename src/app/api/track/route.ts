import { NextRequest, NextResponse } from "next/server";
import { getVisits, writeVisits } from "@/lib/db";
import { uid } from "@/lib/utils";

function getCountryFromRequest(request: NextRequest) {
  const countryCode =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code") ||
    "";

  const normalizedCode = countryCode.trim().toUpperCase();
  if (!normalizedCode || normalizedCode === "XX" || normalizedCode === "UNKNOWN") {
    return "Unknown";
  }

  try {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(normalizedCode) || normalizedCode;
  } catch {
    return normalizedCode;
  }
}

export async function POST(request: NextRequest) {
  const { path, visitorId, revisited } = await request.json();
  const visits = getVisits<any>();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const country = getCountryFromRequest(request);

  visits.push({
    id: uid("visit"),
    path: path || "/",
    visitor_id: visitorId || "unknown",
    revisited: Boolean(revisited),
    ip,
    country,
    created_at: new Date().toISOString()
  });

  writeVisits(visits.slice(-5000));
  return NextResponse.json({ success: true });
}
