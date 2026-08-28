import { renderMikeJonesFacebookOg } from "@/lib/og/mike-jones-facebook";

export const runtime = "nodejs";

export async function GET() {
  const bytes = await renderMikeJonesFacebookOg(3840, 2016);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
