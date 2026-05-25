import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Donations",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Charge = {
  amount: number;
  created: number;
  status: string;
  receipt_email?: string | null;
  billing_details?: { email?: string | null; name?: string | null };
  description?: string | null;
};

async function stripeGet(path: string, key: string): Promise<{ data?: Charge[] } | null> {
  try {
    const r = await fetch(`https://api.stripe.com/v1/${path}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as { data?: Charge[] };
  } catch {
    return null;
  }
}

function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default async function AdminDonationsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/donations");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const key = process.env.STRIPE_SECRET_KEY;

  // Supporter memberships are tracked in the app regardless of Stripe.
  const { data: supporters } = await supabase
    .from("profiles")
    .select("display_name, username, supporter_since")
    .eq("is_supporter", true)
    .order("supporter_since", { ascending: false });
  const supporterCount = supporters?.length ?? 0;

  // Recorded donations (written by the Stripe webhook → donations table).
  const svc = getSupabaseServiceClient();
  const { data: donationRows } = await svc
    .from("donations")
    .select("email, name, amount_cents, recurring, refunded_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const donations = donationRows ?? [];
  const donTotalCents = donations
    .filter((d) => !d.refunded_at)
    .reduce((s, d) => s + (d.amount_cents ?? 0), 0);

  // One-time donation revenue lives in Stripe — pull it if a key is set.
  let totalCents = 0;
  let chargeCount = 0;
  let recent: Charge[] = [];
  let stripeOk = false;
  if (key) {
    const charges = await stripeGet("charges?limit=100", key);
    if (charges?.data) {
      stripeOk = true;
      const ok = charges.data.filter((c) => c.status === "succeeded");
      totalCents = ok.reduce((s, c) => s + c.amount, 0);
      chargeCount = ok.length;
      recent = ok.slice(0, 15);
    }
  }

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight font-display">
        Donations &amp; payments
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Every dollar in, in one place.
      </p>

      {key && stripeOk ? (
        <>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Total raised (last 100 gifts)" value={usd(totalCents)} accent />
            <Stat label="One-time gifts" value={String(chargeCount)} />
            <Stat label="Supporter memberships" value={String(supporterCount)} />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold tracking-tight mb-3">Recent gifts</h2>
            <div className="rounded-2xl border border-[var(--color-line)] overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead className="bg-[var(--color-surface)] text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  <tr>
                    <th className="text-left px-4 py-2 font-bold">When</th>
                    <th className="text-left px-4 py-2 font-bold">From</th>
                    <th className="text-right px-4 py-2 font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c, i) => (
                    <tr key={i} className="border-t border-[var(--color-line)]">
                      <td className="px-4 py-2 text-[var(--color-ink-soft)] whitespace-nowrap">
                        {format(new Date(c.created * 1000), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-2 text-[var(--color-ink-soft)] truncate">
                        {c.billing_details?.name ||
                          c.receipt_email ||
                          c.billing_details?.email ||
                          "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-[var(--color-ink)]">
                        {usd(c.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="mt-6 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-6">
          <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-blue)]">
            Connect Stripe to see revenue
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight font-display">
            One-time donation totals live in Stripe, not here — yet.
          </h2>
          <div className="mt-3 text-sm text-[var(--color-ink-soft)] leading-relaxed space-y-2">
            <p>
              Your &ldquo;Donate&rdquo; button is a Stripe Payment Link, so
              one-time gifts go straight to Stripe and aren&apos;t recorded in
              this app. To pull <strong>total raised, recent gifts, and donor
              emails</strong> right onto this page:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                In Stripe → Developers → API keys, create a{" "}
                <strong>restricted key</strong> with <em>read</em> access to
                Charges + Balance.
              </li>
              <li>
                Add it to the Vercel project env as{" "}
                <code className="font-mono">STRIPE_SECRET_KEY</code>.
              </li>
              <li>Redeploy — this page fills in automatically.</li>
            </ol>
            <p className="text-xs text-[var(--color-muted)]">
              {key
                ? "A key is set, but the Stripe API didn't respond — double-check it's valid and has Charges read access."
                : "No STRIPE_SECRET_KEY is set yet."}
            </p>
          </div>
        </section>
      )}

      {/* Recorded donations from the Stripe webhook */}
      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight mb-1">
          Recorded donations
        </h2>
        <p className="text-xs text-[var(--color-muted)] mb-3">
          {donations.length} recorded in-app · {usd(donTotalCents)} (excl.
          refunds). The native checkout writes these directly via webhook.
        </p>
        {donations.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-soft)] italic">
            No donations recorded in-app yet. One-time gifts through the Payment
            Link show in the Stripe section above.
          </p>
        ) : (
          <ul className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
            {donations.map((d, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-[var(--color-ink-soft)] truncate">
                  {d.name || d.email || "Anonymous"}
                  {d.recurring ? " · recurring" : ""}
                  {d.refunded_at ? " · refunded" : ""}
                </span>
                <span className="font-mono font-bold">
                  {usd(d.amount_cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Supporter memberships — always available from the app DB */}
      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight mb-1">
          Supporter memberships
        </h2>
        <p className="text-xs text-[var(--color-muted)] mb-3">
          {supporterCount} active {supporterCount === 1 ? "supporter" : "supporters"}.
          {" "}Set on a profile in the Users admin.
        </p>
        {supporterCount === 0 ? (
          <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-soft)] italic">
            No active supporter memberships yet.
          </p>
        ) : (
          <ul className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
            {supporters!.map((s, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="font-semibold text-[var(--color-ink)]">
                  {s.display_name || s.username || "Supporter"}
                </span>
                <span className="text-xs text-[var(--color-muted)] font-mono">
                  {s.supporter_since
                    ? `since ${format(new Date(s.supporter_since), "MMM yyyy")}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border-2 p-4",
        accent
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-line)] bg-[var(--color-paper)]",
      ].join(" ")}
    >
      <div
        className={[
          "text-3xl font-bold tabular-nums tracking-tight leading-none",
          accent ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]",
        ].join(" ")}
      >
        {value}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
        {label}
      </div>
    </div>
  );
}
