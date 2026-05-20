import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/db";
import { getPublicUser } from "@/lib/db";
import { hashPassword, setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const user = getUsers<any>().find(
    (entry) => entry.email === email?.toLowerCase() && entry.password === hashPassword(password || "")
  );

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await setSession(user);
  return NextResponse.json({ success: true, user: getPublicUser(user) });
}
