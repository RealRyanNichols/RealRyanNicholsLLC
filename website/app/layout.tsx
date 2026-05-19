import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    ...(SITE.socials.twitter
      ? { site: SITE.socials.twitter, creator: SITE.socials.twitter }
      : {}),
  },
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.name,
    description: SITE.tagline,
    url: SITE.url,
    sameAs: [],
  };

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
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
