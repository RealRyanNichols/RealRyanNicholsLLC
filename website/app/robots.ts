import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

const DISALLOW = [
  "/admin/",
  "/account",
  "/api/",
  "/auth/",
  "/subscribed",
  "/unsubscribed",
];

// AI crawlers are explicitly welcome: the archive exists to be found, read,
// and cited — by people and by every engine that answers questions for them.
// Same boundaries as everyone else (no admin, no api).
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "cohere-ai",
  "CCBot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
