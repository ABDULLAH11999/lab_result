import { NextRequest, NextResponse } from "next/server";
import { createUser, setSession } from "@/lib/auth";
import { getOtps, writeOtps } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    const otps = getOtps<any>();
    const record = otps.find((entry) => entry.email === email?.toLowerCase() && entry.code === otp);
    if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: "That verification code is invalid or expired." }, { status: 400 });
    }

    const user = createUser({
      email: record.email,
      fullName: record.fullName,
      password: record.password
    });

    writeOtps(otps.filter((entry) => entry.id !== record.id));
    await setSession(user);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("OTP verification failed:", error);
    return NextResponse.json(
      { error: error?.message || "We could not verify that code. Please try again." },
      { status: 400 }
    );
  }
}
