const RETIRED_CONTENT_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "text/plain; charset=utf-8",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
} as const;

export function retiredPrivateContentResponse({ head = false }: { head?: boolean } = {}) {
  return new Response(
    head ? null : "This material is unavailable while it undergoes private review.",
    {
      status: 410,
      headers: RETIRED_CONTENT_HEADERS,
    },
  );
}
