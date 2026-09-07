import Link from "next/link";
import { getFuelBill } from "@/lib/fuel-server";
import { usdWhole } from "@/lib/fuel";

/**
 * Token Fund band for the feed. The number is the live AI bill from the
 * funding ledger (never typed here); the band hides itself if the ledger has
 * no AI line items yet, so it can never show a made-up figure.
 */
export async function FuelBand({ className = "" }: { className?: string }) {
  const bill = await getFuelBill();
  if (bill.billCents <= 0) return null;
  const month = usdWhole(bill.billCents);

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
            This machine runs on{" "}
            <span className="text-[var(--color-gold-bright)]">{month} a month</span> in AI
            tokens.
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#cfd9ea]">
            Every article, filing, timeline, and map here is built with them. Fuel a
            day, a week, or a whole article. You pick the job. I do the work.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href="/fuel"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-gold-bright)] px-6 py-3 text-base font-black text-[#071126] transition hover:brightness-105"
          >
            Fuel the machine →
          </Link>
        </div>
      </div>
    </section>
  );
}
