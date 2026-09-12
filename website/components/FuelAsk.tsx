import Link from "next/link";
import { getFuelBill, getMachineOutput } from "@/lib/fuel-server";
import { FUEL_TIME_FLOOR_CENTS, usdWhole } from "@/lib/fuel";

// The article-foot ask, in Ryan's words. It is rendered by the post page so
// that no article ships without it; never paste a copy into a post body.
// The figures are the ledger's overage target and subscription total and the
// real 30-day post count. With no overage line in the ledger the ask still
// runs, just without a number, because a made-up figure is worse than none.
const PICKS = ["spark", "charge", "day"] as const;

export async function FuelAsk({ className = "" }: { className?: string }) {
  const [bill, output] = await Promise.all([getFuelBill(), getMachineOutput()]);
  const target = bill.targetCents > 0 ? usdWhole(bill.targetCents) : null;
  const subs = bill.subscriptionCents > 0 ? usdWhole(bill.subscriptionCents) : null;
  const picks = PICKS.map((slug) => bill.tiers.find((t) => t.slug === slug)).filter(
    (t): t is NonNullable<typeof t> => t !== undefined,
  );

  return (
    <aside
      className={[
        "relative overflow-hidden rounded-2xl border-2 border-[var(--color-gold-bright)] bg-[var(--color-surface)] p-5 text-[var(--color-cream)] shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:p-6",
        className,
      ].join(" ")}
      aria-labelledby="fuel-ask-title"
      data-fuel-ask
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--color-gold-bright)]/15 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <p className="eyebrow">Before you go</p>
        <h2
          id="fuel-ask-title"
          className="mt-1 font-display text-2xl font-black leading-tight tracking-tight text-[var(--color-cream)] sm:text-3xl"
        >
          You just read something built with Claude, ChatGPT, and Grok.{" "}
          <span className="text-[var(--color-gold-bright)]">I pay for every token.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)] sm:text-base">
          The subscriptions are on me. They run dry every half a week, and then the machine stops unless there
          are credits on the account. I need help buying that overage so I can do more, teach more, and create
          more. That only works if what I put out is worth your time. If this was, fuel the next one.
        </p>
        {target ? (
          <p className="mt-2 text-sm font-semibold text-[var(--color-cream)]">
            {subs ? `${subs} a month in subscriptions, paid by me. ` : ""}
            {target} a month in overage credits is the ask
            {output.posts30 !== null && output.posts30 > 0 ? (
              <>
                . {output.posts30.toLocaleString("en-US")} articles in the last 30 days
              </>
            ) : null}
            . The ledger is public.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {picks.map((t) => (
            <Link
              key={t.slug}
              href={`/fuel?tier=${t.slug}#fuel`}
              className="btn-accent inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 font-display text-lg font-black tabular-nums"
            >
              {usdWhole(t.amountCents)}
            </Link>
          ))}
          <Link
            href="/fuel"
            className="btn-ghost inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-sm font-bold"
          >
            See what it buys →
          </Link>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
          Under {usdWhole(FUEL_TIME_FLOOR_CENTS)} fuels the machine and puts your name on the wall.{" "}
          {usdWhole(FUEL_TIME_FLOOR_CENTS)} and up buys my time: a question answered in public, a letter, an
          article on the topic you pick.
        </p>
      </div>
    </aside>
  );
}
