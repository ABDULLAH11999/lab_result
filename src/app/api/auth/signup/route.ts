import { NextRequest, NextResponse } from "next/server";
import { getOtps, writeOtps } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mail";
import { uid } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { fullName, email, password } = await request.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Please provide a valid email and an 8+ character password." }, { status: 400 });
  }

  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const otps = getOtps<any>().filter((entry) => entry.email !== email.toLowerCase());
  otps.push({
    id: uid("otp"),
    email: email.toLowerCase(),
    fullName: fullName?.trim(),
    password,
    code,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });
  writeOtps(otps);

  const delivery = await sendOtpEmail(email.toLowerCase(), code);
  return NextResponse.json({ success: true, ...delivery });
}
