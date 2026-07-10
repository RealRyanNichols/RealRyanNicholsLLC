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
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  async redirects() {
    return [
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
