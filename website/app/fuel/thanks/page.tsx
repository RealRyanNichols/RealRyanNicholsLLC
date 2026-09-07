import Link from "next/link";
import type { Metadata } from "next";
import { requireStripe } from "@/lib/stripe";
import { recordDonationFromSession } from "@/lib/donations";
import { getFuelBill, markFuelIntentPaid } from "@/lib/fuel-server";
import { tierForAmount, usdWhole } from "@/lib/fuel";
import { PurchaseTracker } from "@/components/PurchaseTracker";
import { SignupForm } from "@/components/SignupForm";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Fuel received",
  robots: { index: false, follow: false },
};

export default async function FuelThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  let amountCents = 0;
  let email: string | null = null;
  let tierSlug: string | null = null;

  if (sp.session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = requireStripe();
      const session = await stripe.checkout.sessions.retrieve(sp.session_id);
      amountCents = session.amount_total ?? 0;
      email = session.customer_details?.email ?? null;
      tierSlug = session.metadata?.tier ?? null;
      // Backstops for the webhook: record the money and flip the intent to
      // paid. Both are idempotent.
      await recordDonationFromSession(session).catch(() => {});
      await markFuelIntentPaid(session);
    } catch {
      /* still say thank you */
    }
  }

  const { tiers } = await getFuelBill();
  const tier = tiers.find((t) => t.slug === tierSlug) ?? (amountCents > 0 ? tierForAmount(tiers, amountCents) : null);
  const earned = tier ? tiers.filter((t) => t.amountCents <= tier.amountCents).flatMap((t) => t.gets) : [];

  return (
    <article className="mx-auto max-w-xl px-4 py-16">
      {amountCents > 0 ? <PurchaseTracker amount={amountCents / 100} kind="fuel" /> : null}
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        The Token Fund
      </p>
      <h1 className="mt-2 font-display text-4xl font-black tracking-tight">
        Fuel received.
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--color-ink-soft)]">
        {amountCents > 0 ? `${usdWhole(amountCents)} went straight to me, no middleman. ` : "Your payment went straight to me, no middleman. "}
        {email ? `Stripe is sending the receipt to ${email}.` : "Stripe is sending the receipt to your email."}
      </p>

      {earned.length > 0 ? (
        <section className="mt-8 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5">
          <p className="text-xs font-black uppercase tracking-wider text-[var(--color-accent)]">
            What you get{tier ? ` · ${tier.title}` : ""}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink)]">
            {earned.map((g) => (
              <li key={g} className="flex gap-2">
                <span className="text-[var(--color-accent)]" aria-hidden>
                  ✓
                </span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            I read every note that comes in with a payment. If yours needs a
            reply, it gets one from me, at the email you gave Stripe.
          </p>
        </section>
      ) : null}

      <div className="mt-8">
        <p className="mb-3 text-sm font-bold text-[var(--color-ink)]">
          Get what I publish next, straight to you, no algorithm.
        </p>
        <SignupForm emailEnabled={SITE.emailCaptureEnabled} />
      </div>

      <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/the-map-room" className="text-[var(--color-accent)] underline underline-offset-4">
          Watch the machine run: the Map Room →
        </Link>
        <Link href="/" className="text-[var(--color-accent)] underline underline-offset-4">
          ← Back to the feed
        </Link>
      </div>
    </article>
  );
}
