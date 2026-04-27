import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const PROD_COOKIE_DOMAIN = ".faretta.legal";

function resolveCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  if (host === "faretta.legal" || host.endsWith(".faretta.legal")) {
    return PROD_COOKIE_DOMAIN;
  }
  return undefined;
}

export function createSupabaseBrowserClient() {
  const domain = resolveCookieDomain();
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      domain,
      path: "/",
      sameSite: "lax",
      secure: isHttps,
    },
  });
}
