import sharp from "sharp";
import chunk0 from "@/lib/evidence/mike-jones-sprite/chunk0";
import chunk1 from "@/lib/evidence/mike-jones-sprite/chunk1";
import chunk2 from "@/lib/evidence/mike-jones-sprite/chunk2";
import chunk3 from "@/lib/evidence/mike-jones-sprite/chunk3";
import chunk4 from "@/lib/evidence/mike-jones-sprite/chunk4";
import chunk5 from "@/lib/evidence/mike-jones-sprite/chunk5";
import chunk6 from "@/lib/evidence/mike-jones-sprite/chunk6";
import chunk7 from "@/lib/evidence/mike-jones-sprite/chunk7";

export const runtime = "nodejs";

const encoded = chunk0 + chunk1 + chunk2 + chunk3 + chunk4 + chunk5 + chunk6 + chunk7;
const source = Buffer.from(encoded, "base64");

const RECEIPTS = {
  "receipt-1": { top: 629, height: 828 },
  "receipt-2": { top: 1477, height: 916 },
  "receipt-3": { top: 2413, height: 912 },
  "receipt-4": { top: 0, height: 609 },
} as const;

type ReceiptKey = keyof typeof RECEIPTS;

export async function GET(
  _request: Request,
  context: { params: Promise<{ receipt: string }> },
) {
  const { receipt } = await context.params;
  const crop = RECEIPTS[receipt as ReceiptKey];

  if (!crop) return new Response("Not found", { status: 404 });

  const bytes = await sharp(source)
    .extract({ left: 0, top: crop.top, width: 500, height: crop.height })
    .webp({ quality: 90, effort: 5 })
    .toBuffer();

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
