import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  FIGHTING_SHADOWS_PRODUCT_SLUGS,
  isPhysicalBookProduct,
} from "@/lib/book-fulfillment";
import { BookFulfillmentActions } from "@/components/BookFulfillmentActions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Fighting Shadows Fulfillment",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type BookOrderSummary = {
  product_slug: string;
  payment_status: string;
};

type QueueItem = {
  id: string;
  product_slug: string;
  edition: string;
  status: string;
  hold_reason: string | null;
  pod_ref: number | null;
  attempt_count: number;
  last_error: string | null;
  tracking_url: string | null;
  created_at: string;
};

function labelForProduct(productSlug: string): string {
  if (productSlug === FIGHTING_SHADOWS_PRODUCT_SLUGS.paperback) return "Signed paperback";
  if (productSlug === FIGHTING_SHADOWS_PRODUCT_SLUGS.founding) return "Founding Supporter";
  if (productSlug === FIGHTING_SHADOWS_PRODUCT_SLUGS.digital) return "Early Release digital";
  return productSlug;
}

export default async function BookFulfillmentPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/book-fulfillment");
  const { data: isAdmin } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (isAdmin !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const svc = getSupabaseServiceClient();
  const [ordersResult, settingsResult, queueResult] = await Promise.all([
    svc.from("book_orders").select("product_slug, payment_status"),
    svc.from("book_fulfillment_settings").select("*").eq("id", true).maybeSingle(),
    svc
      .from("book_fulfillments")
      .select(
        "id, product_slug, edition, status, hold_reason, pod_ref, attempt_count, last_error, tracking_url, created_at",
      )
      .order("created_at", { ascending: false }),
  ]);

  const paidOrders = ((ordersResult.data ?? []) as BookOrderSummary[]).filter(
    (order) => order.payment_status === "paid",
  );
  const physicalOrders = paidOrders.filter((order) => isPhysicalBookProduct(order.product_slug));
  const signedPaperbacks = physicalOrders.filter(
    (order) => order.product_slug === FIGHTING_SHADOWS_PRODUCT_SLUGS.paperback,
  ).length;
  const foundingOrders = physicalOrders.filter(
    (order) => order.product_slug === FIGHTING_SHADOWS_PRODUCT_SLUGS.founding,
  ).length;
  const queueAvailable = !settingsResult.error && !queueResult.error;
  const queue = (queueResult.data ?? []) as QueueItem[];
  const settings = settingsResult.data as
    | {
        hold_enabled: boolean;
        proof_approved: boolean;
        live_release_enabled: boolean;
        hold_reason: string;
      }
    | null;

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Private operations
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight font-display">
        Fighting Shadows fulfillment
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-[var(--color-ink-soft)]">
        Paid physical orders are held until both print editions pass proof review. Customer
        shipping addresses stay in Stripe and are not copied into this queue.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Physical commitments", physicalOrders.length],
          ["Signed paperbacks", signedPaperbacks],
          ["Binding unresolved", foundingOrders],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[var(--color-line)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-lg font-bold">Release gate</h2>
        {!queueAvailable ? (
          <p className="mt-2 text-sm text-amber-700">
            The fulfillment migration is prepared in this branch but has not been applied.
          </p>
        ) : (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[var(--color-muted)]">Global hold</dt>
              <dd className="font-bold">{settings?.hold_enabled ? "On" : "Off"}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Proof approved</dt>
              <dd className="font-bold">{settings?.proof_approved ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Live release</dt>
              <dd className="font-bold">{settings?.live_release_enabled ? "Enabled" : "Locked"}</dd>
            </div>
          </dl>
        )}
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          {settings?.hold_reason ??
            "Waiting for approved print files, proof copies, ISBN assignment, and Bookvault credentials."}
        </p>
        {queueAvailable ? <BookFulfillmentActions /> : null}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Private fulfillment queue</h2>
        {queue.length === 0 ? (
          <p className="mt-3 rounded-xl border border-[var(--color-line)] p-4 text-sm text-[var(--color-ink-soft)]">
            No queue records yet. Preparing the queue is an admin-only action and does not place
            or pay for any Bookvault order.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {queue.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--color-line)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{labelForProduct(item.product_slug)}</p>
                  <span className="rounded-full bg-[var(--color-line)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {item.status.replaceAll("_", " ")}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">{item.edition}</span>
                </div>
                {item.hold_reason ? (
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{item.hold_reason}</p>
                ) : null}
                {item.last_error ? (
                  <p className="mt-2 text-sm text-red-700">Last safe error: {item.last_error}</p>
                ) : null}
                {item.tracking_url ? (
                  <a className="mt-2 inline-block text-sm underline" href={item.tracking_url}>
                    Carrier tracking
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-[var(--color-line)] p-5">
        <h2 className="text-lg font-bold">Next safe move</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--color-ink-soft)]">
          <li>Confirm which binding the Founding Supporter Edition receives.</li>
          <li>Approve the final interior and cover PDFs, then assign the two ISBNs.</li>
          <li>Order and approve one paperback proof and one hardcover proof.</li>
          <li>Only then enable live fulfillment and release paid physical orders.</li>
        </ol>
      </section>
    </article>
  );
}
