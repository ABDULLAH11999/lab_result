import { NextRequest, NextResponse } from "next/server";
import { getContacts, writeContacts } from "@/lib/db";
import { sendContactNotification } from "@/lib/mail";
import { uid } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (!payload?.name || !payload?.email || !payload?.subject || !payload?.message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const contacts = getContacts<any>();
  contacts.push({ id: uid("contact"), ...payload, createdAt: new Date().toISOString() });
  writeContacts(contacts);
  await sendContactNotification(payload);

  return NextResponse.json({ success: true });
}
