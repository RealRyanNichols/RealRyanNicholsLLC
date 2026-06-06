import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { BOOK_TIERS } from "@/lib/book";

export const metadata: Metadata = {
  title: "Book — pre-orders & list",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Order = {
  created_at: string;
  customer_email: string | null;
  customer_name: string | null;
  product_name: string | null;
  product_slug: string | null;
  amount_paid: number | null;
  currency: string | null;
  payment_status: string | null;
  preorder_status: string | null;
  supporter_display_name: string | null;
};

type Signup = {
  created_at: string;
  email: string;
  name: string | null;
  source_page: string | null;
};

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function AdminBookPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/book");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  // book_orders / book_email_signups are service-role only (RLS, no policies).
  // We are past the admin gate, so read them with the service client.
  if (!isSupabaseServiceConfigured()) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
      </article>
    );
  }
  const service = getSupabaseServiceClient();
  const [ordersRes, signupCountRes, signupsRes] = await Promise.all([
    service
      .from("book_orders")
      .select(
        "created_at, customer_email, customer_name, product_name, product_slug, amount_paid, currency, payment_status, preorder_status, supporter_display_name",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("book_email_signups")
      .select("*", { count: "exact", head: true }),
    service
      .from("book_email_signups")
      .select("created_at, email, name, source_page")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const orders = (ordersRes.data ?? []) as Order[];
  const signups = (signupsRes.data ?? []) as Signup[];
  const signupTotal = signupCountRes.count ?? 0;

  const paid = orders.filter((o) => o.payment_status === "paid");
  const refunded = orders.filter((o) => o.payment_status === "refunded");
  const grossCents = paid.reduce((sum, o) => sum + (o.amount_paid ?? 0), 0);

  const byTier = BOOK_TIERS.map((t) => ({
    name: t.name,
    count: paid.filter((o) => o.product_slug === t.slug).length,
  }));

  const stats = [
    { label: "Paid pre-orders", value: paid.length.toLocaleString() },
    { label: "Gross revenue", value: usd(grossCents) },
    { label: "On the list", value: signupTotal.toLocaleString() },
    { label: "Refunded", value: refunded.length.toLocaleString() },
  ];

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Fighting Shadows
          </p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight">
            Pre-orders &amp; list
          </h1>
        </div>
        <Link
          href="/admin"
          className="text-sm font-bold text-[var(--color-accent)] hover:underline"
        >
          ← Admin
        </Link>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm"
          >
            <p className="font-display text-3xl font-black tabular-nums text-[var(--color-ink)]">
              {s.value}
            </p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        {byTier.map((t) => (
          <span
            key={t.name}
            className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)]"
          >
            {t.name}:{" "}
            <span className="font-black text-[var(--color-ink)]">{t.count}</span>
          </span>
        ))}
      </section>

      {/* Orders */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-black tracking-normal">
          Pre-orders
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm font-semibold text-[var(--color-muted)]">
            No pre-orders yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--color-line)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[var(--color-surface-2)] text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Buyer</th>
                  <th className="px-3 py-2">Edition</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Supporter name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {orders.map((o, i) => (
                  <tr key={i} className="bg-[var(--color-surface)]">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[var(--color-muted)]">
                      {format(new Date(o.created_at), "MMM d, h:mma")}
                    </td>
                    <td className="px-3 py-2">
                      <span className="block font-bold text-[var(--color-ink)]">
                        {o.customer_name ?? "—"}
                      </span>
                      <span className="block text-xs text-[var(--color-ink-soft)]">
                        {o.customer_email ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--color-ink-soft)]">
                      {o.product_name ?? o.product_slug ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-bold tabular-nums text-[var(--color-ink)]">
                      {usd(o.amount_paid ?? 0)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                          o.payment_status === "paid"
                            ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                            : o.payment_status === "refunded"
                              ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                              : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
                        ].join(" ")}
                      >
                        {o.payment_status ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--color-ink-soft)]">
                      {o.supporter_display_name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Signups */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-black tracking-normal">
          On the list{" "}
          <span className="text-base font-bold text-[var(--color-muted)]">
            ({signupTotal.toLocaleString()})
          </span>
        </h2>
        {signups.length === 0 ? (
          <p className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm font-semibold text-[var(--color-muted)]">
            No signups yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--color-line)]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-[var(--color-surface-2)] text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {signups.map((s, i) => (
                  <tr key={i} className="bg-[var(--color-surface)]">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[var(--color-muted)]">
                      {format(new Date(s.created_at), "MMM d, h:mma")}
                    </td>
                    <td className="px-3 py-2 font-bold text-[var(--color-ink)]">
                      {s.email}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-ink-soft)]">
                      {s.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--color-muted)]">
                      {s.source_page ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Showing the most recent {signups.length}. Full list is in Supabase
          (book_email_signups) and orders are in Stripe.
        </p>
      </section>
    </article>
  );
}
