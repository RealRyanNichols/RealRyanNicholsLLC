import { INDEXNOW_KEY } from "@/lib/indexnow";

// IndexNow ownership verification file — engines fetch /<key>.txt and expect
// the key as the body.
export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
