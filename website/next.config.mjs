const SECURITY_HEADERS = [
  // Force HTTPS for 2 years. Vercel terminates TLS at the edge.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Block clickjacking — refuse to be framed by other sites.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop MIME sniffing attacks.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak referer to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down browser features we don't use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Disable legacy XSS auditor (causes false positives; CSP is the proper fix).
  { key: "X-XSS-Protection", value: "0" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "rpchhzncxigczfojfdtc.supabase.co" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        // Everything EXCEPT /embed/* keeps the strict anti-framing headers.
        source: "/((?!embed/).*)",
        headers: SECURITY_HEADERS,
      },
      {
        // /embed/* exists to be iframed by other sites — same hardening minus
        // X-Frame-Options, with frame-ancestors open instead.
        source: "/embed/:path*",
        headers: [
          ...SECURITY_HEADERS.filter((h) => h.key !== "X-Frame-Options"),
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // --- Consolidation: duplicate doors merged into one. Permanent (308) so
      // search engines move the ranking to the survivor instead of splitting it.
      // NOTE: "/case/people" matches only the exact path — individual profiles
      // at /case/people/<slug> are untouched.
      { source: "/case/briefing", destination: "/case/brief", permanent: true },
      {
        source: "/evidence-the-doj-tried-to-erase",
        destination: "/case/the-salvaged-doj-record",
        permanent: true,
      },
      { source: "/jan-6", destination: "/j6", permanent: true },
      { source: "/case/people", destination: "/case?view=people", permanent: true },
      // Canonical host is the apex. Without this, www serves a full duplicate
      // of every page and search engines split ranking signal between the two.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.realryannichols.com" }],
        destination: "https://realryannichols.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
