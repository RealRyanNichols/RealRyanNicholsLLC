import {
  buildFulfillmentKeys,
  editionForProduct,
  isbnForEdition,
  isPhysicalBookProduct,
  mapStripeShippingToBookvault,
  type BookEdition,
} from "./book-fulfillment";
import {
  assertBookvaultReleaseAllowed,
  BookvaultError,
  createBookvaultOrder,
  getBookvaultOrderByDocRef,
  isBookvaultConfigured,
  localStatusForBookvault,
  type BookvaultOrderRequest,
  type BookvaultOrderResponse,
  validateBookvaultOrder,
} from "./bookvault";
import { requireStripe } from "./stripe";
import { getSupabaseServiceClient } from "./supabase/service";

const PRE_RELEASE_STATUSES = new Set([
  "held",
  "blocked_missing_isbn",
  "blocked_edition",
  "ready",
]);
const CLAIMABLE_STATUSES = ["ready", "validated", "failed", "validating"];
const MAX_AUTOMATIC_ATTEMPTS = 3;
const RETRY_DELAY_MS = 15 * 60 * 1000;
const STALE_CLAIM_MS = 15 * 60 * 1000;

type ReleaseSettings = {
  hold_enabled: boolean;
  proof_approved: boolean;
  live_release_enabled: boolean;
};

type PaidBookOrder = {
  id: string;
  stripe_checkout_session_id: string | null;
  product_slug: string;
};

type ExistingQueueRecord = {
  book_order_id: string;
  edition: BookEdition;
  status: string;
};

type QueueReleaseRecord = {
  id: string;
  book_order_id: string;
  edition: BookEdition;
  isbn: string | null;
  quantity: number;
  status: string;
  doc_ref: string;
  attempt_count: number;
  updated_at: string;
};

export class FulfillmentGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FulfillmentGateError";
  }
}

export class FulfillmentProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FulfillmentProviderError";
  }
}

async function getReleaseSettings(): Promise<ReleaseSettings> {
  const svc = getSupabaseServiceClient();
  const { data, error } = await svc
    .from("book_fulfillment_settings")
    .select("hold_enabled, proof_approved, live_release_enabled")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) {
    throw new FulfillmentGateError("The private release settings could not be read.");
  }
  return data as ReleaseSettings;
}

function assertDatabaseReleaseGate(settings: ReleaseSettings): void {
  if (settings.hold_enabled || !settings.proof_approved || !settings.live_release_enabled) {
    throw new FulfillmentGateError("The proof or live-release database gate is still locked.");
  }
  if (!isBookvaultConfigured()) {
    throw new FulfillmentGateError("Bookvault credentials are not configured.");
  }
  try {
    assertBookvaultReleaseAllowed({ releaseConfirmed: true });
  } catch (error) {
    throw new FulfillmentGateError(
      error instanceof Error ? error.message : "Bookvault release is not configured.",
    );
  }
}

function safeProviderUpdate(response: BookvaultOrderResponse) {
  return {
    status: localStatusForBookvault(response.Progress?.Status),
    pod_ref: response.PodRef ?? null,
    production_cost: response.OrderCost?.ProductionCost ?? null,
    dispatch_cost: response.OrderCost?.DispatchCost ?? null,
    tax: response.OrderCost?.Tax ?? null,
    grand_total: response.OrderCost?.GrandTotal ?? null,
    shipping_service: response.Tracking?.ServName ?? null,
    tracking_number: response.Tracking?.TrackingNumber ?? null,
    tracking_url: response.Tracking?.CombinedURL ?? null,
    dispatched_at: response.Progress?.Dispatched ?? null,
    next_retry_at: null,
    last_error: null,
    updated_at: new Date().toISOString(),
  };
}

async function recordSafeEvent(
  queueId: string,
  eventType: string,
  providerStatus?: string,
) {
  const svc = getSupabaseServiceClient();
  await svc.from("book_fulfillment_events").insert({
    book_fulfillment_id: queueId,
    event_type: eventType,
    provider_status: providerStatus ?? null,
    safe_detail: {},
  });
}

export async function preparePhysicalBookQueue(): Promise<{ eligible: number }> {
  const svc = getSupabaseServiceClient();
  const settings = await getReleaseSettings();
  const [{ data: ordersData, error: ordersError }, { data: existingData, error: existingError }] =
    await Promise.all([
      svc
        .from("book_orders")
        .select("id, stripe_checkout_session_id, product_slug")
        .eq("payment_status", "paid"),
      svc.from("book_fulfillments").select("book_order_id, edition, status"),
    ]);
  if (ordersError || existingError) {
    throw new Error("The private paid-order ledger or fulfillment queue could not be read.");
  }

  const existingByOrderId = new Map(
    ((existingData ?? []) as ExistingQueueRecord[]).map((row) => [row.book_order_id, row]),
  );
  const liveGateOpen =
    !settings.hold_enabled && settings.proof_approved && settings.live_release_enabled;

  const queueRows = ((ordersData ?? []) as PaidBookOrder[])
    .filter(
      (order) =>
        Boolean(order.stripe_checkout_session_id) && isPhysicalBookProduct(order.product_slug),
    )
    .map((order) => {
      const existing = existingByOrderId.get(order.id);
      if (existing && !PRE_RELEASE_STATUSES.has(existing.status)) return null;

      const defaultEdition = editionForProduct(order.product_slug);
      const edition =
        existing?.edition && existing.edition !== "unresolved"
          ? existing.edition
          : defaultEdition;
      if (!edition || !order.stripe_checkout_session_id) return null;

      const isbn = isbnForEdition(edition);
      const keys = buildFulfillmentKeys(order.stripe_checkout_session_id);
      const status =
        edition === "unresolved"
          ? "blocked_edition"
          : !isbn
            ? "blocked_missing_isbn"
            : liveGateOpen
              ? "ready"
              : "held";
      const holdReason =
        edition === "unresolved"
          ? "The Founding Supporter binding must be confirmed before fulfillment."
          : !isbn
            ? `The ${edition} ISBN has not been configured.`
            : liveGateOpen
              ? null
              : "Global proof and release hold is active.";

      return {
        book_order_id: order.id,
        product_slug: order.product_slug,
        edition,
        isbn,
        status,
        hold_reason: holdReason,
        idempotency_key: keys.idempotencyKey,
        doc_ref: keys.docRef,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (queueRows.length > 0) {
    const { error } = await svc
      .from("book_fulfillments")
      .upsert(queueRows, { onConflict: "book_order_id", ignoreDuplicates: false });
    if (error) throw new Error("The private fulfillment queue could not be prepared.");
  }

  return { eligible: queueRows.length };
}

export async function releaseBookvaultQueueItem(
  queueId: string,
): Promise<{ reconciled: boolean; status: string }> {
  const svc = getSupabaseServiceClient();
  const settings = await getReleaseSettings();
  assertDatabaseReleaseGate(settings);

  const { data: queueData, error: queueError } = await svc
    .from("book_fulfillments")
    .select(
      "id, book_order_id, edition, isbn, quantity, status, doc_ref, attempt_count, updated_at",
    )
    .eq("id", queueId)
    .maybeSingle();
  if (queueError || !queueData) {
    throw new FulfillmentGateError("Fulfillment queue record not found.");
  }
  const queue = queueData as QueueReleaseRecord;
  if (queue.edition === "unresolved" || !queue.isbn) {
    throw new FulfillmentGateError("The edition or ISBN is unresolved.");
  }
  if (!CLAIMABLE_STATUSES.includes(queue.status)) {
    throw new FulfillmentGateError(`Queue status ${queue.status} cannot be released.`);
  }
  if (queue.attempt_count >= MAX_AUTOMATIC_ATTEMPTS) {
    throw new FulfillmentGateError("The automatic retry limit has been reached.");
  }

  const attemptAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await svc
    .from("book_fulfillments")
    .update({
      status: "validating",
      attempt_count: queue.attempt_count + 1,
      last_attempt_at: attemptAt,
      last_error: null,
      updated_at: attemptAt,
    })
    .eq("id", queue.id)
    .eq("attempt_count", queue.attempt_count)
    .eq("updated_at", queue.updated_at)
    .in("status", CLAIMABLE_STATUSES)
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) {
    throw new FulfillmentGateError(
      "This queue record was already claimed or changed. Refresh before retrying.",
    );
  }

  try {
    const existing = await getBookvaultOrderByDocRef(queue.doc_ref);
    if (existing) {
      const safeUpdate = safeProviderUpdate(existing);
      await svc.from("book_fulfillments").update(safeUpdate).eq("id", queue.id);
      await recordSafeEvent(queue.id, "provider_order_reconciled", existing.Progress?.Status);
      return { reconciled: true, status: safeUpdate.status };
    }

    const { data: orderData, error: orderError } = await svc
      .from("book_orders")
      .select("stripe_checkout_session_id, payment_status")
      .eq("id", queue.book_order_id)
      .maybeSingle();
    if (orderError || !orderData?.stripe_checkout_session_id || orderData.payment_status !== "paid") {
      throw new Error("The matching paid Stripe order could not be confirmed.");
    }

    const stripe = requireStripe();
    const session = await stripe.checkout.sessions.retrieve(orderData.stripe_checkout_session_id);
    if (session.payment_status !== "paid") {
      throw new Error("Stripe does not report this Checkout Session as paid.");
    }
    const shipping = session.collected_information?.shipping_details;
    const customer = session.customer_details;
    const providerAddress = mapStripeShippingToBookvault({
      name: shipping?.name ?? customer?.name ?? null,
      email: customer?.email ?? null,
      phone: customer?.phone ?? null,
      address: shipping?.address ?? null,
    });
    const providerOrder: BookvaultOrderRequest = {
      DocRef: queue.doc_ref,
      DispatchRequest: { RequestedService: "CheapestTracked" },
      Address: providerAddress,
      OrderLines: [
        { LineNumber: 1, ISBN: queue.isbn, Quantity: queue.quantity, TempID: queue.id },
      ],
      ProductionLevel: "Standard",
      CharityRoundup: false,
    };

    const validated = await validateBookvaultOrder(providerOrder);
    if (validated.CriticalError) {
      throw new BookvaultError("Bookvault rejected the order during validation.", 400);
    }
    await svc
      .from("book_fulfillments")
      .update({ status: "validated", updated_at: new Date().toISOString() })
      .eq("id", queue.id);
    await recordSafeEvent(queue.id, "provider_order_validated", validated.Progress?.Status);

    const created = await createBookvaultOrder(providerOrder, { releaseConfirmed: true });
    if (created.CriticalError || !created.PodRef) {
      throw new BookvaultError("Bookvault did not confirm a created order reference.", 400);
    }
    const safeUpdate = {
      ...safeProviderUpdate(created),
      submitted_at: new Date().toISOString(),
    };
    await svc.from("book_fulfillments").update(safeUpdate).eq("id", queue.id);
    await recordSafeEvent(queue.id, "provider_order_created", created.Progress?.Status);
    return { reconciled: false, status: safeUpdate.status };
  } catch (error) {
    const safeMessage =
      error instanceof Error ? error.message : "Fulfillment failed without a provider response.";
    const retryable =
      error instanceof BookvaultError && (error.status === null || error.status >= 500);
    const nextRetryAt = retryable
      ? new Date(Date.now() + RETRY_DELAY_MS).toISOString()
      : null;
    await svc
      .from("book_fulfillments")
      .update({
        status: "failed",
        last_error: safeMessage,
        next_retry_at: nextRetryAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", queue.id);
    await recordSafeEvent(queue.id, "provider_order_failed");
    throw new FulfillmentProviderError(safeMessage);
  }
}

export async function processNextBookvaultFulfillment(): Promise<{
  processed: boolean;
  reason?: string;
  status?: string;
}> {
  const settings = await getReleaseSettings();
  try {
    assertDatabaseReleaseGate(settings);
  } catch (error) {
    return {
      processed: false,
      reason: error instanceof Error ? error.message : "Release gate is locked.",
    };
  }

  const svc = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS).toISOString();
  const readyResult = await svc
    .from("book_fulfillments")
    .select("id")
    .eq("status", "ready")
    .lt("attempt_count", MAX_AUTOMATIC_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (readyResult.error) {
    throw new Error("The next fulfillment queue record could not be selected.");
  }

  let candidate = readyResult.data;
  if (!candidate) {
    const retryResult = await svc
      .from("book_fulfillments")
      .select("id")
      .eq("status", "failed")
      .lte("next_retry_at", now)
      .lt("attempt_count", MAX_AUTOMATIC_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (retryResult.error) {
      throw new Error("The fulfillment retry queue could not be selected.");
    }
    candidate = retryResult.data;
  }
  if (!candidate) {
    const staleResult = await svc
      .from("book_fulfillments")
      .select("id")
      .eq("status", "validating")
      .lte("updated_at", staleBefore)
      .lt("attempt_count", MAX_AUTOMATIC_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (staleResult.error) {
      throw new Error("The stale fulfillment queue could not be selected.");
    }
    candidate = staleResult.data;
  }
  if (!candidate?.id) return { processed: false, reason: "No releasable order is waiting." };

  const result = await releaseBookvaultQueueItem(candidate.id as string);
  return { processed: true, status: result.status };
}

export async function syncBookvaultStatuses(limit = 10): Promise<number> {
  if (!isBookvaultConfigured()) return 0;
  const svc = getSupabaseServiceClient();
  const { data, error } = await svc
    .from("book_fulfillments")
    .select("id, doc_ref")
    .in("status", [
      "submitted",
      "acknowledged",
      "sent_to_print",
      "batched",
      "printed",
      "dispatched",
    ])
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error("Bookvault status records could not be selected.");

  let synced = 0;
  for (const row of data ?? []) {
    try {
      const providerOrder = await getBookvaultOrderByDocRef(row.doc_ref as string);
      if (!providerOrder) continue;
      await svc
        .from("book_fulfillments")
        .update(safeProviderUpdate(providerOrder))
        .eq("id", row.id);
      synced += 1;
    } catch {
      // A status poll must never change or duplicate the underlying print order.
    }
  }
  return synced;
}
