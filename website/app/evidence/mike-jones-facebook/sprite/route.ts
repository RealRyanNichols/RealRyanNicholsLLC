import chunk0 from "@/lib/evidence/mike-jones-sprite/chunk0";
import chunk1 from "@/lib/evidence/mike-jones-sprite/chunk1";
import chunk2 from "@/lib/evidence/mike-jones-sprite/chunk2";
import chunk3 from "@/lib/evidence/mike-jones-sprite/chunk3";
import chunk4 from "@/lib/evidence/mike-jones-sprite/chunk4";
import chunk5 from "@/lib/evidence/mike-jones-sprite/chunk5";
import chunk6 from "@/lib/evidence/mike-jones-sprite/chunk6";
import chunk7 from "@/lib/evidence/mike-jones-sprite/chunk7";

export const dynamic = "force-static";

const encoded = chunk0 + chunk1 + chunk2 + chunk3 + chunk4 + chunk5 + chunk6 + chunk7;

export function GET() {
  const bytes = Buffer.from(encoded, "base64");

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
