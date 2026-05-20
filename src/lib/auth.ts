import { cookies } from "next/headers";
import { createHash } from "crypto";
import { getPublicUser, getUsers, writeUsers } from "@/lib/db";
import { uid } from "@/lib/utils";
import type { SessionUser } from "@/types";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "labexplain_session";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) return null;

  try {
    const payload = JSON.parse(Buffer.from(session, "base64").toString("utf8"));
    const users = getUsers<any>();
    const user = users.find((entry) => entry.id === payload.id && entry.email === payload.email);
    if (!user || user.is_active === false) return null;
    return getPublicUser(user);
  } catch {
    return null;
  }
}

export async function setSession(user: any) {
  const cookieStore = await cookies();
  const value = Buffer.from(JSON.stringify(getPublicUser(user))).toString("base64");
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function createUser(input: { email: string; fullName?: string; password: string }) {
  const users = getUsers<any>();
  const existing = users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const user = {
    id: uid("user"),
    email: input.email.toLowerCase(),
    fullName: input.fullName?.trim(),
    password: hashPassword(input.password),
    role: "user",
    plan: "free",
    analysesToday: 0,
    analysesLimit: 10,
    createdAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString()
  };

  users.push(user);
  writeUsers(users);
  return user;
}
