import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const PROD_COOKIE_DOMAIN = ".faretta.legal";

const SUPERADMIN_EMAILS = new Set<string>([
  "ryan@realryannichols.com",
  "theflashflash24@gmail.com",
]);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPERADMIN_EMAILS.has(email.toLowerCase());
}

function resolveServerCookieDomain(): string | undefined {
  const host = headers().get("host") ?? "";
  const hostname = host.split(":")[0];
  if (hostname === "faretta.legal" || hostname.endsWith(".faretta.legal")) {
    return PROD_COOKIE_DOMAIN;
  }
  return undefined;
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const domain = resolveServerCookieDomain();
  const protoIsHttps =
    (headers().get("x-forwarded-proto") ?? "https") === "https";

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      domain,
      path: "/",
      sameSite: "lax",
      secure: protoIsHttps,
    },
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value,
            ...options,
            domain: options.domain ?? domain,
          });
        } catch {
          // Server Components cannot set cookies; middleware/route handlers will.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value: "",
            ...options,
            domain: options.domain ?? domain,
            maxAge: 0,
          });
        } catch {
          // Same as above.
        }
      },
    },
  });
}
