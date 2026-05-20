import { NextRequest, NextResponse } from "next/server";
import { getVisits, writeVisits } from "@/lib/db";
import { uid } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { path, visitorId, revisited } = await request.json();
  const visits = getVisits<any>();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  visits.push({
    id: uid("visit"),
    path: path || "/",
    visitor_id: visitorId || "unknown",
    revisited: Boolean(revisited),
    ip,
    created_at: new Date().toISOString()
  });

  writeVisits(visits.slice(-5000));
  return NextResponse.json({ success: true });
}
