import { renderMikeJonesFacebookOg } from "@/lib/og/mike-jones-facebook";

export const runtime = "nodejs";

export async function GET() {
  const bytes = await renderMikeJonesFacebookOg(1200, 630);

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
