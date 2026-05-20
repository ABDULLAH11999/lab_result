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

export async function sendPurchaseConfirmationUser(email: string, planName: string) {
  if (!resend) return { delivered: false };
  const runtime = getRuntimeSettings();

  await resend.emails.send({
    from: runtime.mailFrom,
    to: email,
    subject: `Your ${planName} Plan Purchase is Successful!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-corners: 16px;">
        <h2 style="color: #2563eb;">Thank you for your purchase!</h2>
        <p>We are excited to let you know that your subscription to the <strong>${planName}</strong> plan has been successfully processed.</p>
        <p>You now have full premium access to LabExplain, including unlimited analyses, trend tracking, and complete report history.</p>
        <p>Enjoy analyzing your lab results!</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">${MEDICAL_DISCLAIMER}</p>
      </div>
    `
  });
  return { delivered: true };
}

export async function sendPurchaseNotificationAdmin(customerEmail: string, planName: string) {
  if (!resend) return { delivered: false };
  const runtime = getRuntimeSettings();
  
  // We dynamic import here to avoid potential circular dependency issues
  const { getSettings } = require("@/lib/db");
  const settings = getSettings();
  let receivers: string[] = settings.emailReceivers || [];
  if (receivers.length === 0) {
    receivers = [runtime.supportEmail || "labtest7940@gmail.com"];
  }

  for (const receiver of receivers) {
    try {
      await resend.emails.send({
        from: runtime.mailFrom,
        to: receiver,
        subject: `[Admin Alert] New Paid Plan Purchase: ${planName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #16a34a;">New Paid Subscription!</h2>
            <p>A user has successfully purchased the <strong>${planName}</strong> plan.</p>
            <p><strong>Customer Email:</strong> ${customerEmail}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `
      });
    } catch (err) {
      console.error(`Failed to send admin email to ${receiver}:`, err);
    }
  }

  return { delivered: true };
}

export async function sendTestReceiverEmail(email: string) {
  if (!resend) return { delivered: false };
  const runtime = getRuntimeSettings();

  await resend.emails.send({
    from: runtime.mailFrom,
    to: email,
    subject: "LabExplain SMTP Receiver Test Successful",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">Outbound Email Test Passed!</h2>
        <p>This is a successful transactional email test for your newly added SMTP receiver.</p>
        <p>Your LabExplain email service is active and correctly configured.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Sent by LabExplain Admin Console Control Panel</p>
      </div>
    `
  });

  return { delivered: true };
}
