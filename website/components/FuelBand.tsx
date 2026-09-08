import Link from "next/link";
import { getFuelBill } from "@/lib/fuel-server";
import { usdWhole } from "@/lib/fuel";

/**
 * Token Fund band for the feed and the money pages. Both numbers come from
 * the funding ledger (never typed here): what Ryan pays himself, and the
 * overage-credits target that is the actual ask. The band hides itself when
 * the ledger has no overage line, so it can never show a made-up figure.
 */
export async function FuelBand({ className = "" }: { className?: string }) {
  const bill = await getFuelBill();
  if (bill.targetCents <= 0) return null;
  const target = usdWhole(bill.targetCents);
  const subs = bill.subscriptionCents > 0 ? usdWhole(bill.subscriptionCents) : null;

  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border-2 border-[var(--color-gold-bright)] bg-[#071126] p-5 text-[#fdf8ea] shadow-md sm:p-6",
        className,
      ].join(" ")}
      aria-labelledby="fuel-band-title"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--color-gold-bright)]/15 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-gold-bright)]">
            Token Fund
          </p>
          <h2
            id="fuel-band-title"
            className="mt-1 font-display text-2xl font-black leading-tight tracking-tight text-[#fdf8ea] sm:text-3xl"
          >
            I pay the subscriptions.{" "}
            <span className="text-[var(--color-gold-bright)]">They run dry every half a week.</span>
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#cfd9ea]">
            Every article, filing, timeline, and map here is built on AI tokens.
            {subs ? ` The ${subs} a month in subscriptions is on me.` : ""} The overage credits that keep the
            machine running the rest of the week are the ask: {target} a month, billed by the token at published
            rates. You buy the overage. I do the work.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href="/fuel"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-gold-bright)] px-6 py-3 text-base font-black text-[#071126] transition hover:brightness-105"
          >
            Fuel the overage →
          </Link>
        </div>
      </div>
    </section>
  );
}
