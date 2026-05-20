import { Resend } from "resend";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { getRuntimeSettings } from "@/lib/runtime-config";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOtpEmail(email: string, code: string) {
  if (!resend) {
    return { delivered: false, previewCode: code };
  }

  const runtime = getRuntimeSettings();

  await resend.emails.send({
    from: runtime.mailFrom,
    to: email,
    subject: "Your LabExplain verification code",
    html: `<p>Your LabExplain verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p><p>${MEDICAL_DISCLAIMER}</p>`
  });

  return { delivered: true };
}

export async function sendContactNotification(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!resend) return { delivered: false };
  const runtime = getRuntimeSettings();

  await resend.emails.send({
    from: runtime.mailFrom,
    to: runtime.supportEmail,
    replyTo: payload.email,
    subject: `[LabExplain Contact] ${payload.subject}`,
    html: `<p><strong>Name:</strong> ${payload.name}</p><p><strong>Email:</strong> ${payload.email}</p><p><strong>Message:</strong></p><p>${payload.message.replace(/\n/g, "<br>")}</p><p>${MEDICAL_DISCLAIMER}</p>`
  });

  return { delivered: true };
}
