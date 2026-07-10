import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/**
 * Page metadata whose share card matches the page instead of the site
 * default. Next.js replaces the whole openGraph object per page (no deep
 * merge with layout.tsx), so this always re-attaches an OG image alongside
 * the page-specific copy — otherwise the card would lose its image.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const image = opts.image ?? "/og/site";
  const url = `${SITE.url}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: opts.title,
      description: opts.description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
  };
}
