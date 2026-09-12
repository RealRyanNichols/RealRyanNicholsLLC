import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { getMainPageOgImage } from "@/lib/page-og-catalog";

/** Replace only the share artwork while retaining page-specific metadata. */
export function withMainPageOg(path: string, metadata: Metadata): Metadata {
  const image = getMainPageOgImage(path);
  if (!image) return metadata;
  const title =
    typeof metadata.title === "string"
      ? metadata.title
      : `${SITE.name} — ${SITE.tagline}`;
  const description = metadata.description ?? SITE.description;
  return {
    ...metadata,
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title,
      description,
      url: `${SITE.url}${path}`,
      ...metadata.openGraph,
      images: [image],
    },
    twitter: {
      title: metadata.openGraph?.title ?? title,
      description: metadata.openGraph?.description ?? description,
      ...metadata.twitter,
      card: "summary_large_image",
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

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
  return withMainPageOg(opts.path, {
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
  });
}
