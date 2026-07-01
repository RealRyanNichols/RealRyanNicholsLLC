import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Footer } from "@/components/Footer";
import { MobileSupportBar } from "@/components/MobileSupportBar";
import { PathPicker } from "@/components/PathPicker";
import { RyanChat } from "@/components/RyanChat";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ThirdPartyAnalytics } from "@/components/ThirdPartyAnalytics";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    images: [
      {
        url: "/og/site",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og/site"],
  },
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Ryan Nichols",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1b34",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Site-wide entity graph: the Person, the LLC that publishes the site, and
  // the WebSite itself — cross-referenced by @id so search engines read them
  // as one connected entity (knowledge-panel + sitelink eligibility).
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE.url}/#person`,
        name: SITE.name,
        alternateName: "Ryan Taylor Nichols",
        description: SITE.tagline,
        url: SITE.url,
        image: `${SITE.url}/og/site`,
        sameAs: ["https://x.com/RealRyanNichols"],
      },
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#org`,
        name: "Real Ryan Nichols LLC",
        url: SITE.url,
        logo: `${SITE.url}/og/site`,
        founder: { "@id": `${SITE.url}/#person` },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        inLanguage: "en-US",
        publisher: { "@id": `${SITE.url}/#org` },
      },
    ],
  };

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <AnnouncementBanner />
        <Header />
        <main className="flex-1 w-full pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
        <Footer />
        <MobileSupportBar />
        <PathPicker variant="overlay" />
        <RyanChat variant="launcher" surface="site" />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <Analytics />
        <SpeedInsights />
        <ThirdPartyAnalytics />
        <ServiceWorkerRegister />
        <Link
          href="#top"
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        >
          Back to top
        </Link>
      </body>
    </html>
  );
}
