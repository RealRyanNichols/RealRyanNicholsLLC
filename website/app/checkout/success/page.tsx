import Link from "next/link";
import type { Metadata } from "next";
import { stripe } from "@/lib/stripe";
import { PurchaseTracker } from "@/components/PurchaseTracker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

function usd(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; free?: string; order?: string }>;
}) {
  const sp = await searchParams;

  if (sp.free === "1") {
    return (
      <article className="mx-auto max-w-xl px-4 py-16 text-center">
        <PurchaseTracker amount={0} kind="j6_free" />
        <h1 className="text-3xl font-bold tracking-tight">
          Your free claim is in.
        </h1>
        <p className="mt-4 text-[var(--color-ink-soft)] leading-relaxed">
          Verified as a January 6 defendant — at no charge. Ryan will follow up
          personally with delivery details within 48 hours.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 text-[var(--color-accent)] font-semibold underline underline-offset-4"
        >
          ← Back to the feed
        </Link>
      </article>
    );
  }

  let amount = 0;
  let email: string | null = null;
  let lineItems: { description: string; amount: number; qty: number }[] = [];
  if (sp.session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sp.session_id, {
        expand: ["line_items"],
      });
      amount = session.amount_total ?? 0;
      email = session.customer_details?.email ?? null;
      lineItems = (session.line_items?.data ?? []).map((li) => ({
        description: li.description ?? "Item",
        amount: li.amount_total ?? 0,
        qty: li.quantity ?? 1,
      }));
    } catch {
      /* still show a thank-you even if the lookup fails */
    }
  }

  return (
    <article className="mx-auto max-w-xl px-4 py-16 text-center">
      {amount > 0 ? <PurchaseTracker amount={amount / 100} kind="order" /> : null}
      <h1 className="text-3xl font-bold tracking-tight">Thank you.</h1>
      <p className="mt-4 text-[var(--color-ink-soft)] leading-relaxed">
        Your payment went through — straight to me, no middleman.{" "}
        {email
          ? `A receipt is on its way to ${email}.`
          : "A receipt is on its way to your email."}
      </p>
      {lineItems.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-left">
          {lineItems.map((li, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-[var(--color-ink-soft)]">
                {li.description}
                {li.qty > 1 ? ` ×${li.qty}` : ""}
              </span>
              <span className="font-mono font-bold">{usd(li.amount)}</span>
            </div>
          ))}
          <div className="mt-2 border-t border-[var(--color-line)] pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="font-mono text-[var(--color-accent)]">
              {usd(amount)}
            </span>
          </div>
        </div>
      ) : null}
      <Link
        href="/"
        className="inline-block mt-8 text-[var(--color-accent)] font-semibold underline underline-offset-4"
      >
        ← Back to the feed
      </Link>
    </article>
  );
}
