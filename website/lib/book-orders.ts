// Links a buyer's Stripe pre-order to their logged-in account.
//
// Buyers check out through Stripe Checkout — they are not necessarily signed in
// at the time — so the connection between a purchase (book_orders) and an
// account is the email address they used. book_orders is service-role only
// (RLS, no public policy), so every lookup here must run server-side.

import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export type BookOrder = {
  id: string;
  product_slug: string | null;
  product_name: string | null;
  payment_status: string | null;
  preorder_status: string | null;
  download_token: string | null;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
};

// Escape LIKE/ILIKE wildcards so an email's local part (which can legally
// contain `_`) cannot act as a pattern and over-match other people's orders.
function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (m) => `\\${m}`);
}

/**
 * Every non-refunded book pre-order that belongs to a given email address,
 * newest first. Returns [] when nothing matches or the service client is not
 * configured. The ILIKE is an exact, case-insensitive match (wildcards are
 * escaped); a JS equality check is layered on top as defense in depth.
 */
export async function getBookOrdersForEmail(
  email: string | null | undefined,
): Promise<BookOrder[]> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !isSupabaseServiceConfigured()) return [];

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("book_orders")
    .select(
      "id, customer_email, product_slug, product_name, payment_status, preorder_status, download_token, amount_paid, currency, created_at",
    )
    .ilike("customer_email", escapeLike(normalized))
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Array<BookOrder & { customer_email: string | null }>)
    .filter((o) => (o.customer_email ?? "").trim().toLowerCase() === normalized)
    .filter((o) => o.payment_status !== "refunded")
    .map((o) => ({
      id: o.id,
      product_slug: o.product_slug,
      product_name: o.product_name,
      payment_status: o.payment_status,
      preorder_status: o.preorder_status,
      download_token: o.download_token,
      amount_paid: o.amount_paid,
      currency: o.currency,
      created_at: o.created_at,
    }));
}

/** True once a real digital file has been attached (BOOK_DOWNLOAD_URL is set). */
export function bookFileReady(): boolean {
  return Boolean(process.env.BOOK_DOWNLOAD_URL);
}

const PHYSICAL_SLUGS = new Set([
  "signed_paperback_preorder",
  "founding_supporter_edition",
]);

export type BookEntitlements = {
  /** Every tier includes the digital edition. */
  digital: boolean;
  signedCopy: boolean;
  evidenceAppendix: boolean;
  founding: boolean;
};

/** What a buyer is entitled to, rolled up across all of their orders. */
export function entitlementsFromOrders(orders: BookOrder[]): BookEntitlements {
  const e: BookEntitlements = {
    digital: false,
    signedCopy: false,
    evidenceAppendix: false,
    founding: false,
  };
  for (const o of orders) {
    e.digital = true; // all three tiers ship the digital edition
    const slug = o.product_slug ?? "";
    if (PHYSICAL_SLUGS.has(slug)) e.signedCopy = true;
    if (slug === "founding_supporter_edition") {
      e.evidenceAppendix = true;
      e.founding = true;
    }
  }
  return e;
}
