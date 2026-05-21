import type { Metadata } from "next";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MedicalDisclaimer from "@/components/layout/MedicalDisclaimer";
import TrackPageView from "@/components/TrackPageView";
import { getSettings } from "@/lib/db";
import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE, getSiteKeywords, normalizeBaseUrl, resolveMetadataImageUrl } from "@/lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings<any>();
  const baseUrl = normalizeBaseUrl(settings?.canonicalUrl);
  const siteTitle = settings?.siteTitle || DEFAULT_SITE_TITLE;
  const siteName = settings?.siteName || "LabExplain";
  const siteDescription = settings?.siteDescription || DEFAULT_SITE_DESCRIPTION;
  const faviconUrl = settings?.faviconUrl || "/favicon.svg";
  const ogImageUrl = resolveMetadataImageUrl(baseUrl, settings?.ogImageUrl);
  const keywords = getSiteKeywords(settings);

  return {
    applicationName: siteName,
    title: {
      default: siteTitle,
      template: `%s | ${siteName}`
    },
    description: siteDescription,
    keywords,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: baseUrl
    },
    category: "health",
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
      locale: "en_US",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${siteName} preview` }]
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: [ogImageUrl]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1
      }
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
