import { NextResponse } from "next/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the book file for a valid order token. The file is never in /public —
 * it lives at BOOK_DOWNLOAD_URL (a private/signed URL set later). download_count
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

  const fileUrl = process.env.BOOK_DOWNLOAD_URL;
  if (!fileUrl) {
    // No file attached yet — do NOT count this as a download.
    return NextResponse.json(
      { error: "The download is not ready yet." },
      { status: 409 },
    );
  }

  // A real download is happening — count it once.
  await supabase
    .from("book_orders")
    .update({
      download_count: (order.download_count ?? 0) + 1,
      last_downloaded_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  return NextResponse.redirect(fileUrl, 302);
}
