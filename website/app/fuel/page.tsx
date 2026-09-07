import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { FuelCheckout } from "@/components/FuelCheckout";
import { getFuelBill, getFuelRaised } from "@/lib/fuel-server";
import { getPublishedSupporters } from "@/lib/supporters";
import { FUEL_FLOOR_CENTS, parseFuelMessage, usdWhole } from "@/lib/fuel";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Every article, map, filing summary, and archive page on this site is built with AI tokens Ryan pays for. Fuel the machine and get something back: a question answered, a letter, an article on the topic you pick.";

export const metadata = pageMetadata({
  title: "Fuel the Machine: the Token Fund",
  description: DESCRIPTION,
  path: "/fuel",
});

export default async function FuelPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const sp = await searchParams;
  const [bill, raised, published] = await Promise.all([
    getFuelBill(),
    getFuelRaised(),
    getPublishedSupporters(60),
  ]);
  const paymentsConfigured = !!process.env.STRIPE_SECRET_KEY;
  const wall = published
    .map((s) => ({ ...s, fuel: parseFuelMessage(s.message) }))
    .filter((s) => s.fuel !== null);
  const pct =
    raised && bill.billCents > 0
      ? Math.min(100, Math.round((raised.monthCents / bill.billCents) * 100))
      : 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        The Token Fund
      </p>
      <h1 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-6xl">
        Fuel the machine.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
        This site is not written by a staff. It is written by me, at a keyboard,
        with AI tools I pay for by the token. Every article, every map, every
        filing summary, every one of the 1,500-plus defendant profiles came
        out of that machine. When the tokens run out, the machine stops.
      </p>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
        So here is the deal. You buy the fuel. I do the work. And depending on
        how much fuel you put in, I do some of it for you.
      </p>

      {sp.canceled ? (
        <p className="mt-6 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
          No charge was made. Pick up where you left off whenever you want.
        </p>
      ) : null}

      {/* The bill, straight from the ledger */}
      <section className="mt-10 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
              The bill, from the ledger
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
              {bill.billCents > 0 ? `${usdWhole(bill.billCents)} a month in tokens.` : "The AI bill"}
            </h2>
          </div>
          {raised ? (
            <div className="text-right">
              <p className="font-display text-3xl font-black tabular-nums text-[var(--color-accent)]">
                {usdWhole(raised.monthCents)}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                fueled this month · {raised.monthCount} {raised.monthCount === 1 ? "person" : "people"}
              </p>
            </div>
          ) : null}
        </div>
        {bill.items.length > 0 ? (
          <ul className="mt-4 divide-y divide-[var(--color-line)] text-sm">
            {bill.items.map((i) => (
              <li key={i.label} className="flex items-baseline justify-between gap-4 py-2">
                <span className="text-[var(--color-ink)]">{i.label}</span>
                <span className="font-mono font-bold tabular-nums text-[var(--color-ink)]">
                  {usdWhole(i.amount_cents)}/mo
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            The AI line items are not in the ledger right now. NEEDS AUTHENTICATION.
          </p>
        )}
        {raised && bill.billCents > 0 ? (
          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
                style={{ width: `${pct}%` }}
                aria-hidden
              />
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              {pct}% of this month&apos;s bill is covered. {usdWhole(raised.allTimeCents)} fueled all time.
            </p>
          </div>
        ) : null}
        <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
          Those numbers are the same line items I publish on the funding ledger.
          They change when the bill changes, not when I feel like it.
        </p>
      </section>

      {/* Pick your fuel */}
      <section className="mt-10">
        <p className="text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
          Pick your fuel
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Every tier includes everything below it.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Floor is {usdWhole(FUEL_FLOOR_CENTS)}. Card fees are real and a tiny gift
          can cost more than it gives. Above that, it is your call.
        </p>
        <div className="mt-5">
          <FuelCheckout tiers={bill.tiers} paymentsConfigured={paymentsConfigured} />
        </div>
      </section>

      {/* Straight talk */}
      <section className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">
          Straight talk about where it goes
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          <p>
            <strong className="text-[var(--color-ink)]">There is no button that puts tokens into my Claude or ChatGPT account.</strong>{" "}
            Neither company sells that. Your payment goes through Stripe to me,
            and I buy the credits. Every dollar shows up in my ledger, and the
            monthly total shows on this page.
          </p>
          <p>
            <strong className="text-[var(--color-ink)]">What you get is work, not merchandise.</strong>{" "}
            A question answered in public. A letter. An article on a topic you
            pick, researched and published under the same rules as everything
            else here: public records, public actors, no minors, no private
            data, no invented facts. If a topic breaks those rules I will tell
            you and offer another.
          </p>
          <p>
            <strong className="text-[var(--color-ink)]">Receipts come from Stripe.</strong>{" "}
            This is a payment to a person, not a charitable donation.
          </p>
        </div>
      </section>

      {/* The wall */}
      {wall.length > 0 ? (
        <section className="mt-10">
          <p className="text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
            The Fuel wall
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
            The people keeping the lights on.
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {wall.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
              >
                <p className="text-sm font-bold text-[var(--color-ink)]">
                  {s.display_name ?? "Anonymous"}
                  {s.amount ? (
                    <span className="ml-2 font-mono text-xs font-bold text-[var(--color-accent)]">
                      ${s.amount}
                    </span>
                  ) : null}
                </p>
                {s.fuel?.ask ? (
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">{s.fuel.ask}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Not buying today */}
      <section className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">
          Not today?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Put{" "}
          <Link href="/case" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
            the record
          </Link>{" "}
          in front of one more person,{" "}
          <Link href="/submit" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
            send a tip
          </Link>
          , or{" "}
          <Link href="/book/preorder" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
            get the book
          </Link>
          . All of it keeps the machine moving.
        </p>
      </section>
    </main>
  );
}
