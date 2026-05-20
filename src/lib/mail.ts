import { Resend } from "resend";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { getSettings } from "@/lib/db";
import { getRuntimeSettings } from "@/lib/runtime-config";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraph(value: string) {
  return `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">${value}</p>`;
}

function keyValue(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:13px;width:150px;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function renderEmailTemplate({
  preheader,
  title,
  eyebrow,
  body,
  footerNote = MEDICAL_DISCLAIMER
}: {
  preheader: string;
  title: string;
  eyebrow?: string;
  body: string;
  footerNote?: string;
}) {
  const runtime = getRuntimeSettings();
  const supportEmail = runtime.supportEmail || "hello@labexplain.com";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 14px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 28px 22px;background:#0f172a;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <div style="display:inline-block;width:38px;height:38px;border-radius:12px;background:#2563eb;color:#ffffff;text-align:center;line-height:38px;font-size:20px;font-weight:700;">L</div>
                          <span style="display:inline-block;margin-left:10px;color:#ffffff;font-size:20px;font-weight:800;vertical-align:middle;">LabExplain</span>
                        </td>
                        <td align="right" style="color:#cbd5e1;font-size:12px;">Educational lab report explainer</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 28px 8px;">
                    ${eyebrow ? `<div style="margin-bottom:12px;color:#2563eb;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(eyebrow)}</div>` : ""}
                    <h1 style="margin:0;color:#020617;font-size:28px;line-height:1.2;font-weight:800;">${escapeHtml(title)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 28px;">
                    ${body}
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                    <p style="margin:0 0 10px;color:#64748b;font-size:12px;line-height:1.6;">${escapeHtml(footerNote)}</p>
                    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Need help? Contact ${escapeHtml(supportEmail)}.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendOtpEmail(email: string, code: string) {
  if (!resend) {
    return { delivered: false, previewCode: code };
  }

  const runtime = getRuntimeSettings();

  await resend.emails.send({
    from: runtime.mailFrom,
    to: email,
    subject: "Your LabExplain verification code",
    html: renderEmailTemplate({
      preheader: `Your LabExplain code is ${code}. It expires in 10 minutes.`,
      eyebrow: "Verification code",
      title: "Confirm your LabExplain account",
      body: `
        ${paragraph("Use this one-time code to finish creating your account. Future logins will use only your email and password.")}
        <div style="margin:22px 0;padding:22px;border:1px solid #bfdbfe;border-radius:16px;background:#eff6ff;text-align:center;">
          <div style="color:#1e3a8a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Your code</div>
          <div style="margin-top:8px;color:#0f172a;font-size:34px;font-weight:800;letter-spacing:.18em;">${escapeHtml(code)}</div>
        </div>
        ${paragraph("This code expires in 10 minutes. If you did not request it, you can ignore this email.")}
      `
    })
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
  const safeMessage = escapeHtml(payload.message).replace(/\n/g, "<br>");

  await resend.emails.send({
    from: runtime.mailFrom,
    to: runtime.supportEmail,
    replyTo: payload.email,
    subject: `[LabExplain Contact] ${payload.subject}`,
    html: renderEmailTemplate({
      preheader: `New contact message from ${payload.email}`,
      eyebrow: "Contact form",
      title: payload.subject || "New LabExplain message",
      body: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px;">
          ${keyValue("Name", payload.name)}
          ${keyValue("Email", payload.email)}
        </table>
        <div style="padding:18px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;color:#334155;font-size:15px;line-height:1.7;">${safeMessage}</div>
      `,
      footerNote: "This is an administrative notification from LabExplain."
    })
  });

  return { delivered: true };
}

export async function sendPurchaseConfirmationUser(email: string, planName: string) {
  if (!resend) return { delivered: false };
  const runtime = getRuntimeSettings();

  await resend.emails.send({
    from: runtime.mailFrom,
    to: email,
    subject: `Your ${planName} plan is active`,
    html: renderEmailTemplate({
      preheader: `Your LabExplain ${planName} plan is now active.`,
      eyebrow: "Subscription active",
      title: "Your LabExplain plan is ready",
      body: `
        ${paragraph(`Your subscription to the <strong>${escapeHtml(planName)}</strong> plan has been successfully processed.`)}
        <div style="margin:18px 0;padding:18px;border:1px solid #bbf7d0;border-radius:14px;background:#f0fdf4;">
          <p style="margin:0;color:#166534;font-size:15px;line-height:1.7;font-weight:700;">You now have premium access to unlimited analyses, report history, trend comparison, and PDF export.</p>
        </div>
        ${paragraph("Thanks for using LabExplain to prepare better questions for your healthcare provider.")}
      `
    })
  });
  return { delivered: true };
}

export async function sendPurchaseNotificationAdmin(customerEmail: string, planName: string) {
  if (!resend) return { delivered: false };
  const runtime = getRuntimeSettings();
  const settings = getSettings<any>();
  let receivers: string[] = settings.emailReceivers || [];
  if (receivers.length === 0) {
    receivers = [runtime.supportEmail || "labtest7940@gmail.com"];
  }

  for (const receiver of receivers) {
    try {
      await resend.emails.send({
        from: runtime.mailFrom,
        to: receiver,
        subject: `[LabExplain Admin] New ${planName} purchase`,
        html: renderEmailTemplate({
          preheader: `New paid subscription from ${customerEmail}`,
          eyebrow: "Paid plan purchase",
          title: "New LabExplain subscription",
          body: `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px;">
              ${keyValue("Customer", customerEmail)}
              ${keyValue("Plan", planName)}
              ${keyValue("Date", new Date().toLocaleString())}
            </table>
          `,
          footerNote: "This is an administrative payment notification from LabExplain."
        })
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
    subject: "LabExplain email test successful",
    html: renderEmailTemplate({
      preheader: "Your LabExplain outbound email test was delivered successfully.",
      eyebrow: "Email test",
      title: "Outbound email is working",
      body: `
        ${paragraph("This confirms that LabExplain can send transactional emails through the configured Resend account.")}
        <div style="margin:18px 0;padding:18px;border:1px solid #bfdbfe;border-radius:14px;background:#eff6ff;">
          <p style="margin:0;color:#1e3a8a;font-size:15px;line-height:1.7;font-weight:700;">Receiver configured successfully: ${escapeHtml(email)}</p>
        </div>
      `,
      footerNote: "Sent by the LabExplain admin console."
    })
  });

  return { delivered: true };
}
