import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Paths a signed-in user with an INCOMPLETE profile is still allowed to hit
// without being redirected to /onboarding. Everything else gets gated.
const ONBOARDING_BYPASS_PREFIXES = [
  "/onboarding",
  "/api/",
  "/auth/",
  "/login",
  "/logout",
  "/_next",
];

const ONBOARDING_BYPASS_EXACT = new Set<string>([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/rss.xml",
]);

function shouldBypassOnboarding(pathname: string): boolean {
  if (ONBOARDING_BYPASS_EXACT.has(pathname)) return true;
  for (const prefix of ONBOARDING_BYPASS_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Onboarding gate: any signed-in user whose profile is missing the
  // required real-name fields gets force-routed to /onboarding before
  // they can do anything on the site. Catches the Magic Link signup
  // path where Supabase creates an auth.users row with only an email.
  if (user && !shouldBypassOnboarding(request.nextUrl.pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const incomplete =
      !profile ||
      !profile.full_name?.trim() ||
      !profile.username?.trim() ||
      !profile.display_name?.trim();

    if (incomplete) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.searchParams.set(
        "next",
        request.nextUrl.pathname + request.nextUrl.search,
      );
      return NextResponse.redirect(url);
    }
  }

  return response;
}
