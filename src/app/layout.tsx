import type { Metadata } from "next";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MedicalDisclaimer from "@/components/layout/MedicalDisclaimer";
import TrackPageView from "@/components/TrackPageView";
import { getSettings } from "@/lib/db";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings<any>();
  const baseUrl = settings?.canonicalUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const siteTitle = settings?.siteTitle || "LabExplain | Understand Your Lab Results in Plain English";
  const siteName = settings?.siteName || "LabExplain";
  const siteDescription =
    settings?.siteDescription ||
    "Paste your blood test results and get calm, plain-English explanations for each lab value, how they fit together, and what to ask your doctor next.";
  const faviconUrl = settings?.faviconUrl || "/favicon.svg";
  const ogImageUrl = settings?.ogImageUrl || "/og-default.svg";

  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteName}`
    },
    description: siteDescription,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: baseUrl
    },
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl
    },
    openGraph: {
      type: "website",
      url: baseUrl,
      title: siteTitle,
      description: siteDescription,
      siteName,
      images: [{ url: ogImageUrl }]
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: [ogImageUrl]
    }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <MedicalDisclaimer />
        <TrackPageView />
        <main>{children}</main>
        <Footer />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
