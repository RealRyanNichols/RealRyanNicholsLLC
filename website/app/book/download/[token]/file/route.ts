import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { bundledEditionPath, EDITION_DOWNLOAD_NAME } from "@/lib/book-edition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the book file for a valid order token. The file is never in /public —
 * it ships inside the deployment bundle at private/book, or comes from
 * BOOK_DOWNLOAD_URL when that is set (a private/signed URL wins). download_count
 * is incremented here, only when a real download is triggered.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!isSupabaseServiceConfigured() || !token || token.length < 8) {
    return NextResponse.json({ error: "Invalid link." }, { status: 404 });
  }

  const supabase = getSupabaseServiceClient();
  const { data: order } = await supabase
    .from("book_orders")
    .select("id, download_count, payment_status")
    .eq("download_token", token)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }
  if (order.payment_status === "refunded") {
    return NextResponse.json({ error: "This order was refunded." }, { status: 403 });
  }

  // Resolve the file BEFORE counting, so a failure never burns a download.
  const fileUrl = process.env.BOOK_DOWNLOAD_URL;
  let bytes: Buffer | null = null;
  if (!fileUrl) {
    try {
      bytes = await readFile(bundledEditionPath());
    } catch {
      // No file attached yet — do NOT count this as a download.
      return NextResponse.json(
        { error: "The download is not ready yet." },
        { status: 409 },
      );
    }
  }

  // A real download is happening — count it once.
  await supabase
    .from("book_orders")
    .update({
      download_count: (order.download_count ?? 0) + 1,
      last_downloaded_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (fileUrl) return NextResponse.redirect(fileUrl, 302);

  const file = bytes as Buffer;
  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.byteLength),
      "Content-Disposition": `attachment; filename="${EDITION_DOWNLOAD_NAME}"`,
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
