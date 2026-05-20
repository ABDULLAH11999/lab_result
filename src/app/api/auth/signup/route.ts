import { NextRequest, NextResponse } from "next/server";
import { getOtps, writeOtps, getSettings, getUsers } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mail";
import { uid } from "@/lib/utils";
import { createUser, setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { fullName, email, password } = await request.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Please provide a valid email and an 8+ character password." }, { status: 400 });
  }

  const settings = getSettings();
  const enableOtp = settings.enableOtp !== false; // default to true if not explicitly set to false
  const existingUser = getUsers<any>().find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists. Please log in instead." }, { status: 409 });
  }

  if (!enableOtp) {
    try {
      const user = createUser({
        email: email.toLowerCase(),
        fullName: fullName?.trim(),
        password
      });
      await setSession(user);
      return NextResponse.json({ success: true, directLogin: true });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Could not register user." }, { status: 400 });
    }
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

  try {
    const delivery = await sendOtpEmail(email.toLowerCase(), code);
    return NextResponse.json({ success: true, ...delivery });
  } catch (error) {
    console.error("OTP email failed:", error);
    return NextResponse.json(
      { error: "We could not send the verification email. Please try again in a moment." },
      { status: 502 }
    );
  }
}
