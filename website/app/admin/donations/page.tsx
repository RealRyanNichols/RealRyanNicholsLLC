import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupportNoteModerator } from "@/components/SupportNoteModerator";
import { FundingAdmin } from "@/components/FundingAdmin";

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

type SupportIntent = {
  id: string;
  created_at: string;
  purpose: string;
  intended_amount: string | null;
  display_name: string | null;
  email: string | null;
  message: string | null;
  publish_message: boolean;
  display_as: string;
  show_amount: boolean;
  status: string;
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

  const { data: supportIntents } = await supabase
    .from("support_intents")
    .select(
      "id, created_at, purpose, intended_amount, display_name, email, message, publish_message, display_as, show_amount, status",
    )
    .order("created_at", { ascending: false })
    .limit(25);

  // Transparent funding goal: all line items (incl. inactive) + settings + snapshot.
  const [fundingItemsRes, fundingSettingsRes, fundingSnapRes] = await Promise.all([
    supabase
      .from("funding_line_items")
      .select("id, label, blurb, amount_cents, cadence, sort_order, is_active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("funding_settings")
      .select("campaign_title, campaign_blurb, manual_raised_cents, manual_note, show_amounts")
      .eq("id", "default")
      .maybeSingle(),
    supabase.rpc("funding_snapshot"),
  ]);
  const fundingItems = (fundingItemsRes.data ?? []) as {
    id: string;
    label: string;
    blurb: string | null;
    amount_cents: number;
    cadence: "monthly" | "one_time";
    sort_order: number;
    is_active: boolean;
  }[];
  const fundingSettings = (fundingSettingsRes.data ?? {
    campaign_title: "Fund the truth",
    campaign_blurb: null,
    manual_raised_cents: 0,
    manual_note: null,
    show_amounts: true,
  }) as {
    campaign_title: string;
    campaign_blurb: string | null;
    manual_raised_cents: number;
    manual_note: string | null;
    show_amounts: boolean;
  };
  const fundingGoalCents = fundingItems
    .filter((i) => i.is_active && i.cadence === "monthly")
    .reduce((s, i) => s + i.amount_cents, 0);
  const fundingSnap = Array.isArray(fundingSnapRes.data)
    ? fundingSnapRes.data[0]
    : fundingSnapRes.data;
  const fundingRaisedCents = Number(
    (fundingSnap as { raised_cents?: number } | null)?.raised_cents ?? 0,
  );

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
      <p className="mt-1 inline-block rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
        Legacy — donations retired. Kept as the historical ledger; the public site now sells (book, services, store).
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Every dollar in, in one place.
      </p>

      <FundingAdmin
        initialItems={fundingItems}
        initialSettings={fundingSettings}
        goalCents={fundingGoalCents}
        raisedCents={fundingRaisedCents}
      />

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

      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight mb-1">
          Support notes
        </h2>
        <p className="text-xs text-[var(--color-muted)] mb-3">
          Notes captured on the support page before Stripe opens.
        </p>
        {!supportIntents?.length ? (
          <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-soft)] italic">
            No support notes yet.
          </p>
        ) : (
          <div className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
            {(supportIntents as SupportIntent[]).map((intent) => (
              <article key={intent.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-ink)]">
                      {intent.display_as === "anonymous"
                        ? "Anonymous supporter"
                        : intent.display_name || intent.email || "Supporter"}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {format(new Date(intent.created_at), "MMM d, yyyy h:mm a")}
                      {" · "}
                      {intent.purpose.replaceAll("_", " ")}
                      {intent.intended_amount
                        ? ` · intended $${intent.intended_amount}`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs font-bold text-[var(--color-muted)]">
                    {intent.status}
                  </span>
                </div>
                {intent.message ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-ink-soft)] leading-relaxed">
                    {intent.message}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  Publish message: {intent.publish_message ? "yes" : "no"}
                  {" · "}
                  Show amount: {intent.show_amount ? "yes" : "no"}
                  {" · "}
                  Name: {intent.display_as === "name" ? intent.display_name || "—" : "anonymous"}
                  {intent.email ? ` · ${intent.email}` : ""}
                </p>
                <SupportNoteModerator id={intent.id} status={intent.status} />
              </article>
            ))}
          </div>
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
