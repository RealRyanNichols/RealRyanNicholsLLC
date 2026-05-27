import type { NextFetchEvent, NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Content paths whose arrivals we record (page_arrivals → single source of
// posts.views_count). Everything else still flows through updateSession for
// auth, but is not logged.
const TRACK = /^\/(posts|case|j6|fights)(\/|$)/;

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Preserve the existing Supabase session-refresh behavior.
  const res = await updateSession(request);

  try {
    if (
      request.method === "GET" &&
      TRACK.test(request.nextUrl.pathname) &&
      !isPrefetch(request)
    ) {
      const task = recordArrival(request);
      if (task) event.waitUntil(task);
    }
  } catch {
    // Logging must never break a page load.
  }

  return res;
}

function isPrefetch(req: NextRequest): boolean {
  return (
    req.headers.get("next-router-prefetch") === "1" ||
    req.headers.get("purpose") === "prefetch" ||
    req.headers.get("x-middleware-prefetch") === "1"
  );
}

function recordArrival(req: NextRequest): Promise<unknown> | null {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !anon) return null;

  let projectRef: string | null = null;
  try {
    projectRef = new URL(supaUrl).hostname.split(".")[0];
  } catch {
    projectRef = null;
  }

  const ua = req.headers.get("user-agent") ?? "";
  let referrerHost: string | null = null;
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      referrerHost = new URL(referer).hostname;
    } catch {
      referrerHost = null;
    }
  }

  const body = {
    p_path: req.nextUrl.pathname,
    p_ua_class: classifyUa(ua),
    p_country: req.headers.get("x-vercel-ip-country"),
    p_region: req.headers.get("x-vercel-ip-country-region"),
    p_city: req.headers.get("x-vercel-ip-city"),
    p_referrer_host: referrerHost,
    p_ua: ua.slice(0, 400),
    p_viewer_id: readViewerId(req, projectRef),
  };

  return fetch(`${supaUrl}/rest/v1/rpc/record_page_arrival`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

function classifyUa(uaRaw: string): string {
  const ua = uaRaw.toLowerCase();
  if (!ua) return "unknown";
  if (/(gptbot|oai-searchbot|chatgpt|claudebot|anthropic|claude-web|perplexity|ccbot|google-extended|bytespider|amazonbot|cohere|diffbot)/.test(ua))
    return "ai-bot";
  if (/(facebookexternalhit|facebot|twitterbot|slackbot|telegrambot|whatsapp|discordbot|linkedinbot|redditbot|embedly|pinterest|skypeuripreview|vkshare)/.test(ua))
    return "social-bot";
  if (/(googlebot|bingbot|duckduckbot|baiduspider|yandex|applebot|slurp|sogou|exabot)/.test(ua))
    return "search-bot";
  if (/(uptimerobot|pingdom|statuscake|betteruptime|uptime|headlesschrome|phantomjs|puppeteer|playwright|curl|wget|python-requests|go-http|node-fetch|axios|monitor)/.test(ua))
    return "uptime-bot";
  if (/(bot|crawler|spider|crawl|fetch|scan)/.test(ua)) return "search-bot";
  if (/(mozilla|applewebkit|chrome|crios|safari|firefox|fxios|edg|opr|opera|samsungbrowser)/.test(ua))
    return "human";
  return "unknown";
}

// Best-effort signed-in user id from the Supabase auth cookie, so the arrivals
// trigger can count an admin's own visits only once per post. No verification:
// the RPC re-checks is_admin server-side, and a bad value can only under-count
// the admin, never inflate.
function readViewerId(req: NextRequest, projectRef: string | null): string | null {
  if (!projectRef) return null;
  try {
    const base = `sb-${projectRef}-auth-token`;
    let raw = req.cookies.get(base)?.value;
    if (!raw) {
      const parts: string[] = [];
      for (let i = 0; i < 6; i += 1) {
        const c = req.cookies.get(`${base}.${i}`)?.value;
        if (!c) break;
        parts.push(c);
      }
      if (parts.length) raw = parts.join("");
    }
    if (!raw) return null;
    if (raw.startsWith("base64-")) raw = atob(raw.slice(7));
    const parsed = JSON.parse(raw);
    const accessToken: unknown = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
    if (typeof accessToken !== "string") return null;
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    return typeof payload?.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
