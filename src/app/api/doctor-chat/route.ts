import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSession } from "@/lib/auth";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { checkRateLimit, recordUsage } from "@/lib/rate-limit";

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const MEDICAL_KEYWORDS = [
  "lab",
  "report",
  "blood",
  "cbc",
  "cmp",
  "ldl",
  "hdl",
  "triglycerides",
  "alt",
  "ast",
  "bilirubin",
  "hemoglobin",
  "hematocrit",
  "platelet",
  "ferritin",
  "b12",
  "thyroid",
  "cholesterol",
  "vitamin",
  "ferritin",
  "iron",
  "glucose",
  "a1c",
  "doctor",
  "symptom",
  "diagnosis",
  "test",
  "results",
  "medical",
  "medicine",
  "prescription",
  "pressure",
  "heart",
  "ecg",
  "x-ray",
  "scan",
  "pain",
  "fever",
  "fatigue",
  "hospital"
];

function isRelevantMedicalMessage(message: string) {
  const normalized = message.toLowerCase();
  return MEDICAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function getDeterministicDoctorReply(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("what does cbc stand for") ||
    normalized.includes("cbc stands for") ||
    normalized.includes("what is cbc") ||
    normalized === "cbc"
  ) {
    return "CBC stands for Complete Blood Count. It is a common blood test that looks at parts of your blood such as white blood cells, red blood cells, hemoglobin, hematocrit, and platelets. Doctors often use it as a general overview to look for patterns like infection, anemia, inflammation, or other changes that may need follow-up.";
  }

  return null;
}

function quotaMessage(isGuest: boolean, isFreeUser: boolean) {
  if (isGuest) {
    return {
      message: "You have used all 3 free AI Doctor chats for today. Sign up to continue chatting and get 5 chats per day.",
      ctaLabel: "Sign up free",
      ctaHref: "/auth/register"
    };
  }

  if (isFreeUser) {
    return {
      message: "You have used all 5 AI Doctor chats for today. See our pricing to unlock more chat with Doctor.",
      ctaLabel: "See pricing",
      ctaHref: "/pricing"
    };
  }

  return {
    message: "Your plan allows unlimited doctor chat access.",
    ctaLabel: "Analyze report",
    ctaHref: "/analyze"
  };
}

async function generateDoctorReply(history: Array<{ role: "user" | "assistant"; content: string }>) {
  if (!gemini) {
    return `I can help with general lab result and medical report questions in plain English. ${MEDICAL_DISCLAIMER}`;
  }

  const model = gemini.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 500
    }
  });

  const conversation = history
    .slice(-8)
    .map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`)
    .join("\n");

  const prompt = `
You are LabExplain's AI Doctor chat assistant.

Rules:
- Answer only health, lab result, medical report, symptom, or doctor-visit related questions.
- Give educational information only. Do not diagnose, prescribe, or claim certainty.
- Keep answers calm, helpful, plain-English, and concise.
- If the situation sounds urgent, advise the user to contact a doctor or urgent care promptly.
- End naturally without markdown lists unless needed.
- Include this idea naturally when relevant: discuss results with a doctor.

Conversation:
${conversation}

Write the next assistant reply in 2 to 5 sentences.
`;

  const result = await model.generateContent(prompt);
  const reply = result.response.text().trim();
  return reply || `I can help explain medical reports in plain English. ${MEDICAL_DISCLAIMER}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const history = Array.isArray(body?.history) ? body.history : [];

  if (message.length < 2) {
    return NextResponse.json({ error: "Please enter a medical question." }, { status: 400 });
  }

  const session = await getSession();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const tier = session ? session.plan : "guest";
  const identifier = session?.id || ip;
  const limiterTier = tier === "pro" ? "pro" : tier === "free" ? "free" : "guest";
  const rate = await checkRateLimit(identifier, limiterTier, "doctor_chat");

  if (!rate.allowed) {
    const quota = quotaMessage(!session, limiterTier === "free");
    return NextResponse.json(
      {
        error: "Daily doctor chat limit reached.",
        message: quota.message,
        ctaLabel: quota.ctaLabel,
        ctaHref: quota.ctaHref,
        quotaReached: true,
        isGuest: !session
      },
      { status: 429 }
    );
  }

  if (!isRelevantMedicalMessage(message)) {
    await recordUsage(identifier, limiterTier, "doctor_chat");
    return NextResponse.json({
      reply:
        "Sorry, I cannot help or assist with you regarding this. I can only help with medical reports, lab values, symptoms, and doctor-related health questions.",
      relevant: false,
      remaining: rate.remaining,
      ctaLabel: "Analyze your report",
      ctaHref: "/analyze"
    });
  }

  try {
    const deterministicReply = getDeterministicDoctorReply(message);
    if (deterministicReply) {
      await recordUsage(identifier, limiterTier, "doctor_chat");
      return NextResponse.json({
        reply: `${deterministicReply}\n\n${MEDICAL_DISCLAIMER}`,
        relevant: true,
        remaining: rate.remaining,
        ctaLabel: "Analyze a report",
        ctaHref: "/analyze"
      });
    }

    const safeHistory = history
      .filter((entry: any) => entry && (entry.role === "user" || entry.role === "assistant") && typeof entry.content === "string")
      .map((entry: any) => ({
        role: entry.role as "user" | "assistant",
        content: entry.content.slice(0, 1200)
      }));

    const reply = await generateDoctorReply([...safeHistory, { role: "user", content: message.slice(0, 1200) }]);
    await recordUsage(identifier, limiterTier, "doctor_chat");

    return NextResponse.json({
      reply: `${reply}\n\n${MEDICAL_DISCLAIMER}`,
      relevant: true,
      remaining: rate.remaining,
      ctaLabel: "Analyze a report",
      ctaHref: "/analyze"
    });
  } catch {
    await recordUsage(identifier, limiterTier, "doctor_chat");
    return NextResponse.json({
      reply:
        `I can help with general medical report questions right now, but I could not generate a full answer at this moment. Please try again, or upload your report for a structured explanation.\n\n${MEDICAL_DISCLAIMER}`,
      relevant: true,
      remaining: rate.remaining,
      ctaLabel: "Analyze a report",
      ctaHref: "/analyze"
    });
  }
}
