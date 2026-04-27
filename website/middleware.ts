import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PROD_COOKIE_DOMAIN = ".faretta.legal";
const SUPERADMIN_EMAILS = new Set<string>([
  "ryan@realryannichols.com",
  "theflashflash24@gmail.com",
]);

function cookieDomainForRequest(req: NextRequest): string | undefined {
  const host = req.headers.get("host")?.split(":")[0] ?? "";
  if (host === "faretta.legal" || host.endsWith(".faretta.legal")) {
    return PROD_COOKIE_DOMAIN;
  }
  return undefined;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const domain = cookieDomainForRequest(req);
  const isHttps = (req.headers.get("x-forwarded-proto") ?? "https") === "https";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain,
        path: "/",
        sameSite: "lax",
        secure: isHttps,
      },
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
            domain: options.domain ?? domain,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: "",
            ...options,
            domain: options.domain ?? domain,
            maxAge: 0,
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const url = req.nextUrl;

  const isAdminPath = url.pathname.startsWith("/admin");
  const isAccountPath = url.pathname.startsWith("/account");
  const requiresAuth = isAdminPath || isAccountPath;

  if (requiresAuth && !user) {
    const loginUrl = url.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(url.pathname + url.search)}`;
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && user) {
    const email = user.email?.toLowerCase();
    if (!email || !SUPERADMIN_EMAILS.has(email)) {
      const homeUrl = url.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
