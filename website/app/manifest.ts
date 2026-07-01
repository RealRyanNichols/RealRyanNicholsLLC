import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Web app manifest — makes the site installable (Add to Home Screen / PWA) and
// is the foundation for packaging to the app stores (Google Play via TWA,
// App Store via a wrapper, Microsoft Store via PWABuilder). The extra fields
// (lang, dir, shortcuts, screenshots) raise the PWABuilder score so it will
// generate high-quality Android / iOS / Windows store packages.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    id: "/",
    start_url: "/?source=app",
    scope: "/",
    lang: "en-US",
    dir: "ltr",
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
    // Long-press app-icon quick actions (Android / Windows).
    shortcuts: [
      {
        name: "Talk to Ryan",
        short_name: "Talk to Ryan",
        description: "Start a direct-line conversation with Ryan",
        url: "/?source=app&intent=talk",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "The Case",
        short_name: "The Case",
        description: "Read the record and the evidence archive",
        url: "/case?source=app",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "The Book",
        short_name: "The Book",
        description: "They tried to bury me. I wrote the book.",
        url: "/book?source=app",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    // Store-listing / install-prompt screenshots. Wide = desktop/tablet,
    // narrow (form_factor omitted) = phone.
    screenshots: [
      {
        src: "/screenshots/wide-home.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "The front porch — Ryan's own platform",
      },
      {
        src: "/screenshots/narrow-home.png",
        sizes: "720x1280",
        type: "image/png",
        label: "Talk to Ryan — a direct line",
      },
    ],
  };
}
