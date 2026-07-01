import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Web app manifest — makes the site installable (Add to Home Screen / PWA) and
// is the foundation for packaging to the app stores (Google Play via TWA,
// App Store via a wrapper, Microsoft Store via PWABuilder).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf7f0",
    theme_color: "#0b1b34",
    categories: ["news", "social", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
