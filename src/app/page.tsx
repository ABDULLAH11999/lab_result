import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Clipboard,
  HeartPulse,
  HelpCircle,
  MessageSquareQuote,
  ShieldCheck,
  Upload
} from "lucide-react";
import { Card } from "@/components/ui/card";
import AnalyzePageClient from "@/components/analyze/AnalyzePageClient";
import AIDoctorWidget from "@/components/home/AIDoctorWidget";
import { getSettings } from "@/lib/db";
import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE, getSiteKeywords, normalizeBaseUrl, resolveMetadataImageUrl } from "@/lib/seo";
import type { Metadata } from "next";

const features = [
  "Explains every value in plain English",
  "Flags what looks normal, borderline, or concerning",
  "Connects patterns across CBC, CMP, lipids, thyroid, A1c, and vitamins",
  "Generates doctor questions to ask at your appointment"
];

const faqs = [
  {
    question: "Can I use a phone photo of my lab report?",
    answer: "Yes. You can upload a clear photo or use your camera to scan the paper report. LabExplain will try to read the text and place it into the analyzer for you."
  },
  {
    question: "What if I am not comfortable with technology?",
    answer: "That is exactly who this homepage is designed for. You can paste text, upload a PDF, or simply take a picture. Then press one button and read the explanation in plain English."
  },
  {
    question: "Will this tell me if I have a disease?",
    answer: "No. LabExplain is educational only. It helps you understand what the numbers usually mean, but it does not diagnose conditions or replace your doctor."
  },
  {
    question: "What kinds of reports work best?",
    answer: "CBC, CMP, cholesterol, thyroid, HbA1c, vitamin D, ferritin, iron, and many other standard blood test reports work well, especially when the report includes reference ranges."
  }
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings<any>();
  const baseUrl = normalizeBaseUrl(settings?.canonicalUrl);
  const title =
    settings?.siteTitle ||
    "Free Lab Report Analyzer & Medical Report Summary Tool | Upload PDF or Scan | LabExplain";
  const description =
    settings?.siteDescription ||
    "Upload a PDF, scan a paper report, or paste your lab results to get a free lab report summary, medical report explanation, blood test overview, and clear doctor questions in plain English.";
  const ogImage = resolveMetadataImageUrl(baseUrl, settings?.ogImageUrl);

  return {
    title,
    description,
    keywords: getSiteKeywords(settings),
    alternates: {
      canonical: baseUrl
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: baseUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "LabExplain preview" }]
    },
    twitter: {
      title,
      description,
      images: [ogImage]
    }
  };
}

export default function HomePage() {
  const siteUrl = "https://labexplain.online";
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LabExplain",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "Free lab report analyzer and medical report summary tool that explains uploaded PDFs, scans, and pasted blood test reports in plain English.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: [
      "Free lab report summary",
      "Medical report explanation",
      "Upload PDF lab report analyzer",
      "Scan paper report with camera",
      "Plain-English blood test overview",
      "Doctor question generator"
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="hero-glow overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-12 lg:py-16">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
              Free lab report summary tool for uploaded PDFs, scans, and pasted lab results
            </div>
            <h1 className="font-syne max-w-3xl text-[2.65rem] font-extrabold leading-[0.95] tracking-tight text-slate-950 sm:text-5xl sm:leading-none lg:text-6xl">
              Free Medical Report Analyzer
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
              Get a free lab report summary, medical report overview, and plain-English blood test explanation. Paste the report, upload the PDF, or scan a paper slip with your phone to analyze your report online.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Works for CBC, CMP, cholesterol, thyroid, vitamin, HbA1c, ferritin, iron, and many general medical report PDFs from Labcorp, Quest, MyChart, and hospital portals.
            </p>
            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-blue-700">
                  <Clipboard className="size-4" />
                  <span className="text-sm font-semibold">Paste text</span>
                </div>
                <p className="text-sm leading-6 text-slate-600">Best for copied results from MyChart, Quest, Labcorp, or your clinic portal when you want a quick free lab report explanation.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-blue-700">
                  <Camera className="size-4" />
                  <span className="text-sm font-semibold">Scan paper report</span>
                </div>
                <p className="text-sm leading-6 text-slate-600">Take a photo of a printed lab slip if that is easier than typing everything out and get a free medical report overview.</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500 sm:mt-5">Guest: 3 analyses/day. Free account: 10/day. Pro: unlimited history, trends, and export.</p>
          </div>

          <AnalyzePageClient
            embedded
            title="Scan or Analyze Your Report"
            description="Choose the easiest free option: paste text, upload a lab PDF, or scan a medical report with your camera for a plain-English report explanation."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <h2 className="font-syne text-2xl font-bold text-slate-950 sm:text-3xl">What you will get back</h2>
          <p className="mt-3 text-slate-600">A visual, calm lab report summary and medical report explanation instead of a list of scary numbers.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <Card className="p-5 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-800">
                <HeartPulse className="size-6" />
              </div>
              <div>
                <h2 className="font-syne text-xl font-bold text-slate-950 sm:text-2xl">Why people use LabExplain</h2>
                <p className="text-sm text-slate-500">A calmer, faster way to understand a report before the doctor visit.</p>
              </div>
            </div>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-700">{feature}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
              <div className="mb-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Visual Results Preview
              </div>
              <h3 className="font-syne text-xl font-bold text-slate-950 sm:text-2xl">See the kind of output patients get</h3>
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-syne text-lg font-bold text-slate-950 sm:text-xl">Overall Summary</p>
                    <p className="text-sm text-slate-500">Simple language, not medical jargon</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Worth Watching
                  </span>
                </div>
                <p className="text-sm leading-7 text-slate-700">
                  A few values are mildly outside the usual range. Nothing in this preview suggests panic, but the lower hemoglobin and higher LDL are worth discussing with your doctor together.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-rose-700">
                    <AlertTriangle className="size-4" />
                    <span className="text-sm font-semibold">Hemoglobin</span>
                  </div>
                  <p className="font-mono text-sm text-slate-700">11.8 g/dL</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Lower than the listed range, which can happen for several reasons and should be interpreted with the rest of your CBC.</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="size-4" />
                    <span className="text-sm font-semibold">LDL Cholesterol</span>
                  </div>
                  <p className="font-mono text-sm text-slate-700">142 mg/dL</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Flagged high on many lab reports. The meaning depends on age, heart risk, and the rest of your cholesterol panel.</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquareQuote className="size-4 text-blue-700" />
                  <p className="text-sm font-semibold text-slate-900">Questions for your doctor</p>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="rounded-xl bg-white p-3">Should I repeat these labs, and if so, when?</div>
                  <div className="rounded-xl bg-white p-3">Could the low hemoglobin and low MCV be related?</div>
                  <div className="rounded-xl bg-white p-3">What changes matter most based on my age and history?</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 max-w-2xl sm:mb-10">
            <h2 className="font-syne text-2xl font-bold text-slate-950 sm:text-3xl">Three easy ways to start</h2>
            <p className="mt-3 text-slate-600">Designed for people who want the simplest possible path from report to explanation.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Clipboard, title: "Paste your report", text: "Copy the text from Labcorp, Quest, MyChart, or a doctor portal." },
              { icon: Upload, title: "Upload the file", text: "Upload a PDF, text file, or report image if you do not want to copy and paste." },
              { icon: Camera, title: "Scan a paper receipt", text: "Use your phone camera to photograph the printed slip and let LabExplain read it for you." }
            ].map((item) => (
              <Card key={item.title} className="p-6">
                <item.icon className="mb-4 size-7 text-blue-700" />
                <h3 className="font-syne text-xl font-bold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-10 text-center sm:mb-12">
          <HelpCircle className="mx-auto mb-4 size-8 text-blue-700" />
          <h2 className="font-syne text-2xl font-bold text-slate-950 sm:text-3xl">Frequently Asked Questions</h2>
          <p className="mt-3 text-slate-600">Short answers for the questions most people have before using the tool.</p>
        </div>
        <div className="mx-auto max-w-4xl space-y-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-3xl border border-slate-200 bg-white p-0 shadow-sm">
              <summary className="cursor-pointer list-none px-5 py-4 font-syne text-base font-bold text-slate-950 sm:px-6 sm:py-5 sm:text-lg">
                <div className="flex items-center justify-between gap-4">
                  <span>{faq.question}</span>
                  <ArrowRight className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                </div>
              </summary>
              <div className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600 sm:px-6 sm:py-5">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
      <AIDoctorWidget />
    </div>
  );
}
