import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-guard";
import {
  FulfillmentGateError,
  FulfillmentProviderError,
  preparePhysicalBookQueue,
  releaseBookvaultQueueItem,
} from "@/lib/bookvault-fulfillment";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("prepare") }),
  z.object({
    action: z.literal("release"),
    queueId: z.string().uuid(),
    confirmation: z.literal("RELEASE_TO_BOOKVAULT"),
  }),
]);

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const svc = getSupabaseServiceClient();
  const [{ data: settings, error: settingsError }, { data: queue, error: queueError }] =
    await Promise.all([
      svc.from("book_fulfillment_settings").select("*").eq("id", true).maybeSingle(),
      svc
        .from("book_fulfillments")
        .select(
          "id, book_order_id, product_slug, edition, isbn, quantity, status, hold_reason, doc_ref, pod_ref, attempt_count, last_attempt_at, next_retry_at, last_error, currency, production_cost, dispatch_cost, tax, grand_total, shipping_service, tracking_number, tracking_url, submitted_at, dispatched_at, created_at, updated_at",
        )
        .order("created_at", { ascending: false }),
    ]);

  if (settingsError || queueError) {
    return NextResponse.json(
      { error: "The fulfillment migration has not been applied or the queue could not be read." },
      { status: 503 },
    );
  }
  return NextResponse.json({ settings, queue });
}

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = actionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid fulfillment action." }, { status: 400 });
  }

  try {
    if (parsed.data.action === "prepare") {
      const result = await preparePhysicalBookQueue();
      return NextResponse.json({ ok: true, prepared: result.eligible });
    }
    const result = await releaseBookvaultQueueItem(parsed.data.queueId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fulfillment action failed.";
    const status =
      error instanceof FulfillmentGateError
        ? 409
        : error instanceof FulfillmentProviderError
          ? 502
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
