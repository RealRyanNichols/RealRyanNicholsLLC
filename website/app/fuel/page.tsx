import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { FuelCheckout } from "@/components/FuelCheckout";
import { FuelQuickPick } from "@/components/FuelQuickPick";
import { FuelMeter } from "@/components/FuelMeter";
import { FuelLadder } from "@/components/FuelLadder";
import { ShareRail } from "@/components/ShareRail";
import { getFuelBill, getFuelStatus, getMachineOutput } from "@/lib/fuel-server";
import { getPublishedSupporters } from "@/lib/supporters";
import { getCaseTotals } from "@/lib/case";
import { SITE } from "@/lib/site";
import { FUEL_FLOOR_CENTS, FUEL_MONTHLY, parseFuelMessage, usdWhole } from "@/lib/fuel";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "This machine runs on AI tokens Ryan pays for. Every article, filing summary, map, and defendant profile comes out of it. You buy the fuel, he does the work, and depending on how much fuel you put in, he does some of it for you.";

export const metadata = pageMetadata({
  title: "Fuel the Machine: the Token Fund",
  description: DESCRIPTION,
  path: "/fuel",
  image: "/og/fuel",
});

// Public archives the machine built, with the live count each one carries.
// Only real routes on this site; counts come from site_totals and posts.
const SITES_BUILT = [
  { name: "Premier Dental Academy of Longview", href: "https://premierdentalacademyoflongview.com", note: "A school's site, start to finish" },
  { name: "The LeadFlow Pro", href: "https://theleadflowpro.com", note: "Where client builds are delivered" },
  { name: "RepWatchr", href: "/store", note: "Reputation watch tool" },
  { name: "SellerProof", href: "/store", note: "Seller verification tool" },
];

export default async function FuelPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string; tier?: string }>;
}) {
  const sp = await searchParams;
  const [bill, status, published, output, caseTotals] = await Promise.all([
    getFuelBill(),
    getFuelStatus(),
    getPublishedSupporters(60),
    getMachineOutput(),
    getCaseTotals().catch(() => null),
  ]);
  const paymentsConfigured = !!process.env.STRIPE_SECRET_KEY;
  const wall = published
    .map((s) => ({ ...s, fuel: parseFuelMessage(s.message) }))
    .filter((s) => s.fuel !== null);
  const keepers = wall.filter((s) => /keeper/i.test(s.fuel?.tier ?? ""));
  const others = wall.filter((s) => !/keeper/i.test(s.fuel?.tier ?? ""));
  const hasBill = bill.billCents > 0;
  const fuelUrl = `${SITE.url}/fuel`;
  const perDay = hasBill ? usdWhole(Math.round(bill.billCents / 30)) : null;

  const archives = [
    output.posts30 !== null && output.posts30 > 0
      ? { value: output.posts30, label: "articles in the last 30 days", href: "/", cta: "Read the feed" }
      : null,
    output.defendants > 0
      ? { value: output.defendants, label: "J6 defendant profiles, free to every defendant", href: "/j6", cta: "Open the archive" }
      : null,
    output.documents > 0
      ? { value: output.documents, label: "case documents on the record", href: "/case?view=documents", cta: "Open the files" }
      : null,
    output.totalViews > 0
      ? { value: output.totalViews, label: "total reach, every page ever loaded", href: "/the-map-room", cta: "Watch it live" }
      : null,
  ].filter((r): r is { value: number; label: string; href: string; cta: string } => r !== null);

  return (
    <main className="pb-16">
      {/* ── Hero: the ask, the number, the live meter, the buttons ─────── */}
      <section className="relative overflow-hidden bg-[#071126] text-[#fdf8ea]">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[var(--color-gold-bright)]/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[var(--color-accent)]/20 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--color-gold-bright)]">
            The Token Fund
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-6xl">
            This machine runs on tokens.
            <br />
            <span className="text-[var(--color-gold-bright)]">You can fuel it.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#cfd9ea] sm:text-xl">
            Every article, filing summary, map, timeline, and defendant profile on this
            site is built with AI tokens I pay for by the token.
            {hasBill ? (
              <>
                {" "}
                The bill is <strong className="text-[#fdf8ea]">{usdWhole(bill.billCents)} a month</strong>
                {perDay ? <>, about {perDay} a day</> : null}.
              </>
            ) : null}{" "}
            When the tokens run out, the machine stops.
          </p>
          <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#fdf8ea] sm:text-xl">
            You buy the fuel. I do the work. Put in enough and I do some of it for you.
          </p>

          {sp.canceled ? (
            <p className="mt-6 max-w-2xl rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-[#cfd9ea]">
              No charge was made. Pick up where you left off whenever you want.
            </p>
          ) : null}

          {hasBill ? (
            <div className="mt-8">
              <FuelMeter initial={status} />
            </div>
          ) : null}

          <div className="mt-6">
            <FuelQuickPick tiers={bill.tiers} />
            <p className="mt-3 text-xs text-[#a9b7d0]">
              One tap picks the amount. Stripe takes the card. No account, no app, no middleman. Monthly stops whenever you say.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* ── What your fuel does ───────────────────────────────────────── */}
        {hasBill ? (
          <section className="mt-12" aria-labelledby="fuel-ladder-title">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">What your fuel does</p>
            <h2 id="fuel-ladder-title" className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Five dollars is three hours of the machine. Fifty is a day.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Not a metaphor. The bill divided by thirty days is what a day costs, and the last thirty days of
              articles is what a day produces. Every bar below is that math.
            </p>
            <div className="mt-5">
              <FuelLadder tiers={bill.tiers} billCents={bill.billCents} posts30={output.posts30} />
            </div>
          </section>
        ) : null}

        {/* ── The good the fuel did ─────────────────────────────────────── */}
        {archives.length > 0 ? (
          <section className="mt-12" aria-labelledby="fuel-good">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
              What the fuel already bought
            </p>
            <h2 id="fuel-good" className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Not a promise. A record you can open.
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {archives.map((a) => (
                <Link key={a.label} href={a.href} className="qa-tile group flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="font-display text-3xl font-black tabular-nums tracking-tight text-[var(--color-ink)] sm:text-4xl">
                      {a.value.toLocaleString("en-US")}
                    </p>
                    <p className="mt-1 text-sm font-bold leading-snug text-[var(--color-ink-soft)]">{a.label}</p>
                  </div>
                  <span className="shrink-0 text-xs font-black uppercase tracking-wider text-[var(--color-accent)] transition group-hover:underline">
                    {a.cta} →
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Every one of those came out of the machine. None of it exists without tokens, and none of it was
              written by a staff. It was me, at a keyboard, with the tools this fund pays for.
            </p>

            {/* Built with the same machine, for other people */}
            <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
              <p className="text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
                Built with the same machine, for other people
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {SITES_BUILT.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      target={s.href.startsWith("http") ? "_blank" : undefined}
                      rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm transition hover:border-[var(--color-accent)]"
                    >
                      <span className="font-bold text-[var(--color-ink)]">{s.name}</span>
                      <span className="text-right text-xs text-[var(--color-muted)]">{s.note}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                The same system that publishes this site builds sites, tools, and archives for businesses and
                people who want to own their platform.{" "}
                <Link href="/services" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
                  That is the paid side.
                </Link>{" "}
                The fuel keeps the free side alive.
              </p>
            </div>
          </section>
        ) : null}

        {/* ── The bill, from the ledger ─────────────────────────────────── */}
        <section className="mt-12 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
                The bill, from the ledger
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                {hasBill ? `${usdWhole(bill.billCents)} a month in tokens.` : "The AI bill"}
              </h2>
            </div>
            {perDay ? (
              <p className="text-sm font-bold text-[var(--color-ink-soft)]">
                That is {perDay} a day, every day the machine runs.
              </p>
            ) : null}
          </div>
          {bill.items.length > 0 ? (
            <ul className="mt-4 divide-y divide-[var(--color-line)] text-sm">
              {bill.items.map((i) => (
                <li key={i.label} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="text-[var(--color-ink)]">{i.label}</span>
                  <span className="font-mono font-bold tabular-nums text-[var(--color-ink)]">{usdWhole(i.amount_cents)}/mo</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              The AI line items are not in the ledger right now. NEEDS AUTHENTICATION.
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
            Same line items I publish on the funding ledger. They change when the bill changes, not when
            I feel like it.
          </p>
        </section>

        {/* ── Why I ask ─────────────────────────────────────────────────── */}
        <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">Why I ask</p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              I would rather earn it. This is the closest thing I have.
            </h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
              <p>
                {caseTotals ? (
                  <>
                    I spent <strong className="text-[var(--color-ink)]">{caseTotals.daysDetained.toLocaleString("en-US")} days</strong> in
                    federal custody before a pardon and a dismissal with prejudice.{" "}
                  </>
                ) : (
                  <>I spent years in federal custody before a pardon and a dismissal with prejudice. </>
                )}
                I came home to no business, no marriage, and a record nobody was going to publish for me.
              </p>
              <p>
                So I built the machine that publishes it. Articles. Filings in plain English. Timelines.
                Maps. A profile for every J6 defendant who wants one, free. All of it runs on tokens, and
                the tokens cost what the ledger above says they cost.
              </p>
              <p>
                This is not a handout. It is work, fueled in public. You put fuel in, the work gets done,
                and you get a piece of it back.
              </p>
              <p className="font-display text-lg font-bold text-[var(--color-ink)]">
                &ldquo;You meant evil against me, but God meant it for good.&rdquo;{" "}
                <span className="text-sm font-semibold text-[var(--color-muted)]">Genesis 50:20</span>
              </p>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-[var(--color-gold-bright)] bg-[var(--color-support-soft)]/60 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-[var(--color-support-strong)]">
              Where the next tank goes
            </p>
            <ul className="mt-3 space-y-3 text-sm text-[var(--color-ink)]">
              <li>
                <Link href="/j6" className="font-bold underline underline-offset-4 hover:text-[var(--color-accent)]">
                  Every J6 defendant on the record
                </Link>
                <span className="block text-[var(--color-ink-soft)]">A free profile for every one who wants it. No family pays for that here.</span>
              </li>
              <li>
                <Link href="/book/preorder" className="font-bold underline underline-offset-4 hover:text-[var(--color-accent)]">
                  Fighting Shadows, the book
                </Link>
                <span className="block text-[var(--color-ink-soft)]">The whole story, with receipts, on the way out the door.</span>
              </li>
              <li>
                <a href="#fuel" className="font-bold underline underline-offset-4 hover:text-[var(--color-accent)]">
                  The next commissioned article
                </a>
                <span className="block text-[var(--color-ink-soft)]">Could be yours. Pick the topic at the {usdWhole(50000)} tier.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── The form ─────────────────────────────────────────────────── */}
        <section id="fuel" className="mt-14 scroll-mt-24" aria-labelledby="fuel-form-title">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">Fuel the machine</p>
          <h2 id="fuel-form-title" className="mt-1 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Pick your fuel. Every tier includes everything below it.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Floor is {usdWhole(FUEL_FLOOR_CENTS)}. Card fees are real, and under that the fee starts winning.
            Above it, it is your call. Or make it {usdWhole(FUEL_MONTHLY.amountCents)} a month and become a Keeper.
          </p>
          <div className="mt-6 rounded-3xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-6">
            <FuelCheckout
              tiers={bill.tiers}
              paymentsConfigured={paymentsConfigured}
              billCents={bill.billCents}
              posts30={output.posts30}
              initialTier={sp.tier ?? null}
            />
          </div>
        </section>

        {/* ── Straight talk + questions ────────────────────────────────── */}
        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">
              Straight talk about where it goes
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              <p>
                <strong className="text-[var(--color-ink)]">There is no button that puts tokens into my Claude or ChatGPT account.</strong>{" "}
                Neither company sells that. Your payment goes through Stripe to me, and I buy the credits.
                Every dollar shows up in my ledger, and the month&apos;s total shows on this page.
              </p>
              <p>
                <strong className="text-[var(--color-ink)]">What you get is work, not merchandise.</strong>{" "}
                A question answered in public. A letter. An article on a topic you pick, researched and
                published under the same rules as everything else here: public records, public actors, no
                minors, no private data, no invented facts.
              </p>
              <p>
                <strong className="text-[var(--color-ink)]">Receipts come from Stripe.</strong> This is a
                payment to a person, not a charitable donation.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">Questions people ask</h2>
            <div className="mt-2 divide-y divide-[var(--color-line)]">
              <Faq q="What if my topic breaks the rules?">
                I tell you, and I offer another. Public records, public actors, no minors, no private data,
                no invented facts. Same rules as every article on this site.
              </Faq>
              <Faq q="Can I stay anonymous?">
                Yes. Pick it on the form. Your name never touches the wall, and I still read your note.
              </Faq>
              <Faq q="How do I know it went to tokens?">
                The bill on this page comes from the same ledger I publish. The meter at the top reads the
                money as it lands. Compare the two any month you like.
              </Faq>
              <Faq q="How does monthly work, and how do I stop it?">
                Stripe charges {usdWhole(FUEL_MONTHLY.amountCents)} on the same day each month. Write to me
                any time and I end it; the last month billed is the last charge.
              </Faq>
              <Faq q="I cannot give right now. What helps?">
                Put the record in front of one more person. The share buttons below do that in one tap, and
                every reader who lands here is a reader the algorithms did not get to throttle.
              </Faq>
            </div>
          </div>
        </section>

        {/* ── The wall ─────────────────────────────────────────────────── */}
        <section className="mt-12" aria-labelledby="fuel-wall" id="fuel-wall">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">The Fuel wall</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {wall.length > 0 ? "The people keeping the lights on." : "The first names go here."}
          </h2>
          {keepers.length > 0 ? (
            <div className="mt-4 rounded-2xl border-2 border-[var(--color-navy)] bg-[var(--color-blue-soft)]/50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-[var(--color-navy)]">Keepers · every month</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {keepers.map((s) => (
                  <li key={s.id} className="rounded-full bg-[var(--color-navy)] px-3 py-1 text-sm font-bold text-[var(--color-paper)]">
                    {s.display_name ?? "Anonymous"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {others.length > 0 ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((s) => (
                <li key={s.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                  <p className="text-sm font-bold text-[var(--color-ink)]">
                    {s.display_name ?? "Anonymous"}
                    {s.amount ? (
                      <span className="ml-2 font-mono text-xs font-bold text-[var(--color-accent)]">${s.amount}</span>
                    ) : null}
                    {/founding/i.test(s.fuel?.tier ?? "") ? (
                      <span className="ml-2 rounded-full bg-[var(--color-gold-bright)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#071126]">
                        Founding
                      </span>
                    ) : null}
                  </p>
                  {s.fuel?.tier ? (
                    <p className="mt-0.5 text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">{s.fuel.tier}</p>
                  ) : null}
                  {s.fuel?.ask ? (
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">{s.fuel.ask}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {wall.length === 0 ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Nobody has fueled this tank yet. The first name on this wall is the one people will remember,
              and I will remember it in writing.{" "}
              <a href="#fuel" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
                Be first.
              </a>
            </p>
          ) : null}
        </section>

        {/* ── Share ────────────────────────────────────────────────────── */}
        <section className="mt-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">Not today?</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Put this in front of one more person.</h2>
          <div className="mt-4">
            <ShareRail
              url={fuelUrl}
              title="This machine runs on tokens. You can fuel it. Ryan Nichols pays for every article, filing, and map by the token:"
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Or{" "}
            <Link href="/submit" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
              send a tip
            </Link>
            ,{" "}
            <Link href="/book/preorder" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
              get the book
            </Link>
            , or{" "}
            <Link href="/case" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
              read the record
            </Link>
            . All of it keeps the machine moving.
          </p>
        </section>
      </div>
    </main>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group py-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[var(--color-ink)] [&::-webkit-details-marker]:hidden">
        {q}
        <span className="text-[var(--color-accent)] transition group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <p className="pb-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{children}</p>
    </details>
  );
}
