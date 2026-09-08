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
import {
  FABLE_RATES,
  FUEL_FLOOR_CENTS,
  FUEL_MONTHLY,
  FUEL_TIME_FLOOR_CENTS,
  MEASURED_DAY_CENTS,
  MEASURED_MIX,
  WORKING_DAY_HOURS,
  compactTokens,
  costPerOutputTokenUsd,
  machineTimeLabel,
  parseFuelMessage,
  roundWords,
  timeTiers,
  tokensFor,
  usdWhole,
} from "@/lib/fuel";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Ryan pays the AI subscriptions himself. They run dry every half a week. The Token Fund buys the overage credits that keep the machine running, and what a dollar buys is arithmetic on published rates. Put in enough and he does some of the work for you.";

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

// How one article works, in Ryan's own order: search, share card, title,
// subheadline, description, click, proof, action, reach.
const BILLBOARD = [
  { t: "Search", s: "Someone types the words in the headline" },
  { t: "Share card", s: "One picture, a few words, its own story" },
  { t: "Title", s: "The promise" },
  { t: "Subheadline", s: "The stakes" },
  { t: "Description", s: "The line under the picture" },
  { t: "Click", s: "They are on my land now, not a feed" },
  { t: "Proof", s: "Records, dates, screenshots, data" },
  { t: "Action", s: "Forms, buttons, links, the ask" },
  { t: "Reach", s: "One more reader, for as long as it ranks" },
];

// What comes out of the machine besides articles. Only real routes.
const MACHINE_DOES = [
  {
    title: "Websites",
    body: "A whole site, start to finish, on a domain you own. The school site further down this page is one.",
    href: "/services",
    cta: "See the builds",
  },
  {
    title: "Funnels and lead systems",
    body: "Pages that capture a call, a signup, or a sale, then follow up without you.",
    href: "/services",
    cta: "How a build works",
  },
  {
    title: "Tools",
    body: "The Records & Bodycam Request Generator, share cards, embeds. Free, no signup.",
    href: "/tools",
    cta: "Use them",
  },
  {
    title: "Investigations and research",
    body: "Screenshots, filings, timelines, and public records turned into a case file nobody can wave away.",
    href: "/case-builder",
    cta: "Build a case file",
  },
  {
    title: "Connecting people",
    body: "A free profile for every J6 defendant, and a place to tell your story when nobody else will run it.",
    href: "/tell-your-story",
    cta: "Tell yours",
  },
  {
    title: "Answers",
    body: "A question you did not know how to find the answer to, researched and answered in public.",
    href: "#fuel-time",
    cta: `Ask one at ${usdWhole(FUEL_TIME_FLOOR_CENTS)}`,
  },
];

// Sticker prices behind the ledger, read off the vendors' own pages on the
// date below. Update the date when you re-check them; never guess a price.
const PRICES_CHECKED = "September 7, 2026";
const STICKER = [
  "Claude Max: $100 a month for 5x Pro usage, $200 a month for 20x, each with a five-hour session limit and a weekly limit. There is no bigger plan. Past the limits, usage credits at standard API rates.",
  `${FABLE_RATES.model} by the token: $${FABLE_RATES.input} per million in, $${FABLE_RATES.cacheRead} per million cached, $${FABLE_RATES.output} per million out.`,
  "ChatGPT Pro: $100 a month for 5x Plus usage, $200 for 20x. Past the limit, extra credits, metered by the token.",
];

// The measured days, in the order they read best.
const MEASURED_DAYS = [
  { label: "A light day", cents: MEASURED_DAY_CENTS.light },
  { label: "My average day", cents: MEASURED_DAY_CENTS.average },
  { label: "A heavy day", cents: MEASURED_DAY_CENTS.heavy },
  { label: "The heaviest day in the log", cents: MEASURED_DAY_CENTS.heaviest },
];

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

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
  const hasTarget = bill.targetCents > 0;
  const target = hasTarget ? usdWhole(bill.targetCents) : null;
  const subs = bill.subscriptionCents > 0 ? usdWhole(bill.subscriptionCents) : null;
  const subsNames = joinNames(bill.subscriptions.map((s) => s.label.replace(/\s*\(.*\)\s*$/, "")));
  const fuelUrl = `${SITE.url}/fuel`;
  const five = tokensFor(500);
  const fifty = machineTimeLabel(5_000);
  const perOutput = costPerOutputTokenUsd();

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

  // The tiers that buy Ryan's time, plus the monthly Keeper lane.
  const timeRows = [
    ...timeTiers(bill.tiers).map((t) => ({ ...t, monthly: false })),
    { ...FUEL_MONTHLY, monthly: true },
  ].sort((a, b) => a.amountCents - b.amountCents || (a.monthly ? 1 : -1));
  const floor = usdWhole(FUEL_TIME_FLOOR_CENTS);

  // Every tier plus the Keeper lane, for the unit-math table.
  const mathRows = [...bill.tiers, FUEL_MONTHLY]
    .map((t) => ({ ...t, buy: tokensFor(t.amountCents), time: machineTimeLabel(t.amountCents) }))
    .sort((a, b) => a.amountCents - b.amountCents);

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
            I run out of tokens every half a week.
            <br />
            <span className="text-[var(--color-gold-bright)]">You can keep the faucet open.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#cfd9ea] sm:text-xl">
            Every article, filing summary, map, timeline, and defendant profile on this site is built with AI
            tokens.{" "}
            {subs ? (
              <>
                The subscriptions, <strong className="text-[#fdf8ea]">{subs} a month</strong> for {subsNames}, are on
                me.
              </>
            ) : (
              <>The subscriptions are on me.</>
            )}{" "}
            I am not asking anyone to cover those. What runs dry is the included usage, usually by the middle of
            the week. Past that, the only lane either company sells is usage credits, billed by the token at
            published rates.
            {target ? (
              <>
                {" "}
                Your fuel buys those credits. That is the whole ask:{" "}
                <strong className="text-[#fdf8ea]">{target} a month in overage credits</strong> keeps the machine
                running all week.
              </>
            ) : null}
          </p>
          <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#fdf8ea] sm:text-xl">
            You buy the overage. I do the work. Put in enough and I do some of it for you.
          </p>

          {sp.canceled ? (
            <p className="mt-6 max-w-2xl rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-[#cfd9ea]">
              No charge was made. Pick up where you left off whenever you want.
            </p>
          ) : null}

          {hasTarget ? (
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
        <section className="mt-12" aria-labelledby="fuel-ladder-title">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">What your fuel does</p>
          <h2 id="fuel-ladder-title" className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {usdWhole(500)} buys about {roundWords(five.words)} words. {usdWhole(5_000)} buys {fifty}.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Not a metaphor. Anthropic publishes the price of every token. The mix of tokens is measured off my own
            machine. Every bar below is that arithmetic, and it is labeled an estimate because a tokens-per-article
            meter does not exist yet.
          </p>
          <div className="mt-5">
            <FuelLadder tiers={bill.tiers} />
          </div>
        </section>

        {/* ── The math, in the open ────────────────────────────────────── */}
        <section className="mt-12" aria-labelledby="fuel-math">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">The math, in the open</p>
            <span className="rounded-full border border-[var(--color-gold-bright)] bg-[var(--color-support-soft)] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[var(--color-support-strong)]">
              Estimate
            </span>
          </div>
          <h2 id="fuel-math" className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            A dollar is a number of tokens. Here is the arithmetic.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Two inputs, both with a source, and nothing else. Anthropic publishes the price of every token. I
            measured the mix of tokens my own work burns. Multiply, and a dollar becomes words and hours. Nobody
            has metered a single article yet, so every figure here is an estimate and says so. The first month
            that runs on credits, the real number replaces it.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">Input 1 · the rate card</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                <strong className="text-[var(--color-ink)]">{FABLE_RATES.model}:</strong> ${FABLE_RATES.input} per million tokens
                in, ${FABLE_RATES.cacheRead} per million cached, ${FABLE_RATES.output} per million out. Read from Anthropic&apos;s
                pricing page on {FABLE_RATES.checkedOn}. Usage credits are billed at exactly these rates.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">Input 2 · my measured mix</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                For every output token, my work carries{" "}
                <strong className="text-[var(--color-ink)]">{MEASURED_MIX.inputPerOutput} input tokens</strong> and{" "}
                <strong className="text-[var(--color-ink)]">{MEASURED_MIX.cacheReadPerOutput} cache reads</strong>. Measured with
                ccusage on my own machine, {MEASURED_MIX.window}, {MEASURED_MIX.activeDays} active days. All in, one output
                token costs about ${perOutput.toFixed(5)}.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                  <th className="px-4 py-3">Fuel</th>
                  <th className="px-4 py-3">Words of output</th>
                  <th className="px-4 py-3">Output tokens</th>
                  <th className="px-4 py-3">Input it carries</th>
                  <th className="px-4 py-3">Cache reads</th>
                  <th className="px-4 py-3">Machine time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {mathRows.map((r) => (
                  <tr key={r.slug}>
                    <td className="px-4 py-2.5 font-display text-lg font-black tabular-nums text-[var(--color-ink)]">
                      {usdWhole(r.amountCents)}
                      {r.slug === FUEL_MONTHLY.slug ? <span className="text-xs font-bold text-[var(--color-muted)]">/mo</span> : null}
                    </td>
                    <td className="px-4 py-2.5 font-bold tabular-nums text-[var(--color-ink)]">{roundWords(r.buy.words)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-[var(--color-ink-soft)]">{compactTokens(r.buy.outputTokens)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-[var(--color-ink-soft)]">{compactTokens(r.buy.inputTokens)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-[var(--color-ink-soft)]">{compactTokens(r.buy.cacheReadTokens)}</td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{r.time?.replace(" of the machine", "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.2fr] md:items-start">
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
              <table className="w-full text-left text-sm">
                <caption className="px-4 pt-3 text-left text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                  What a day of my work costs in credits, from the same log
                </caption>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {MEASURED_DAYS.map((d) => (
                    <tr key={d.label}>
                      <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{d.label}</td>
                      <td className="px-4 py-2.5 text-right font-display text-lg font-black tabular-nums text-[var(--color-ink)]">
                        {usdWhole(d.cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">How the real number gets made</p>
              <p className="mt-1">
                Machine time above is the gift against my average day, {usdWhole(MEASURED_DAY_CENTS.average)} of tokens over{" "}
                {WORKING_DAY_HOURS} hours. Words are output tokens times 0.75, reasoning included. Those are the two
                assumptions, and they are both written down.
              </p>
              <p className="mt-2">
                Turn usage credits on. Run a month. Read the meter. The day a metered article exists, its cost goes
                here, the word estimate comes off, and every tier on this page re-prices itself from the same file.
              </p>
            </div>
          </div>
        </section>

        {/* ── Why articles ─────────────────────────────────────────────── */}
        <section className="mt-12" aria-labelledby="fuel-why-articles">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">Why articles</p>
          <h2 id="fuel-why-articles" className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            A post dies in a day. An article is an evergreen billboard.
          </h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
            <div className="space-y-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
              <p>
                A post on a feed reaches a sliver of the people who follow you, for about a day, and then it is
                gone. An article on my own domain is there the next time anyone on earth types those words into
                Google. Nobody throttles it. Nobody deletes it. It gets indexed, it ranks, and it keeps working
                while I sleep.
              </p>
              <p>
                Here is how one works. Somebody searches the words in the headline. The share card comes up and
                tells its own story in one picture and a few words. Then the title. Then the subheadline. Then the
                description under the picture. They click. Inside is the proof: the records, the dates, the
                screenshots, the data. Data tells a story. Then the forms, the buttons, the links, and the call to
                action that turn a reader into a share, a signup, a call, or a sale.
              </p>
              <p>
                <strong className="text-[var(--color-ink)]">That is one reader the feed was never going to give me.</strong>{" "}
                {output.posts30 !== null && output.posts30 > 0
                  ? `Do it ${output.posts30.toLocaleString("en-US")} times in thirty days, like the last thirty,`
                  : "Do it every day,"}{" "}
                and you have an archive that widens the audience on its own.
              </p>
              <p>
                Give me your information and I do the same thing for you. Researched. Written the right way.
                Published on a domain that already ranks. Wired with the forms and buttons that make it pay.{" "}
                <a href="#fuel-time" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
                  That starts at {floor}.
                </a>
              </p>
            </div>
            <ol className="grid grid-cols-3 gap-2" aria-label="How one article works">
              {BILLBOARD.map((s, i) => (
                <li key={s.t} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-2.5 sm:p-3">
                  <span className="font-display text-2xl font-black tabular-nums text-[var(--color-accent)]">{i + 1}</span>
                  <span className="mt-0.5 block text-xs font-bold leading-tight text-[var(--color-ink)] sm:text-sm">{s.t}</span>
                  <span className="mt-1 block text-[11px] leading-snug text-[var(--color-muted)]">{s.s}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Not just articles ────────────────────────────────────────── */}
        <section className="mt-12" aria-labelledby="fuel-more">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">Not just articles</p>
          <h2 id="fuel-more" className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Articles are one thing that comes out of the machine.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            I build sites. I build funnels. I build tools. I run investigations and research. I connect people who
            need each other. I find answers to questions you did not know how to ask. All of it runs on the same
            tokens.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MACHINE_DOES.map((m) => (
              <li key={m.title}>
                <Link href={m.href} className="qa-tile group flex h-full flex-col p-4">
                  <span className="text-sm font-black text-[var(--color-ink)]">{m.title}</span>
                  <span className="mt-1 flex-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">{m.body}</span>
                  <span className="mt-3 text-xs font-black uppercase tracking-wider text-[var(--color-accent)] transition group-hover:underline">
                    {m.cta} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ── The good the fuel did ─────────────────────────────────────── */}
        {archives.length > 0 ? (
          <section className="mt-12" aria-labelledby="fuel-good">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
              What the machine already built
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
              written by a staff. It was me, at a keyboard, with the tools this fund keeps running.
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

        {/* ── Where the money goes, from the ledger ─────────────────────── */}
        <section
          id="fuel-ledger"
          className="mt-12 scroll-mt-24 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6"
          aria-labelledby="fuel-ledger-title"
        >
          <p className="text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
            Where the money goes, from the ledger
          </p>
          <h2 id="fuel-ledger-title" className="mt-1 font-display text-2xl font-bold tracking-tight">
            {target ? `${target} a month in overage credits. That is the ask.` : "The ask, from the ledger"}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                What I pay myself · not the ask
              </p>
              {bill.subscriptions.length > 0 ? (
                <>
                  <ul className="mt-2 divide-y divide-[var(--color-line)] text-sm">
                    {bill.subscriptions.map((i) => (
                      <li key={i.label} className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-[var(--color-ink)]">{i.label}</span>
                        <span className="font-mono font-bold tabular-nums text-[var(--color-ink)]">{usdWhole(i.amount_cents)}/mo</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm font-bold text-[var(--color-ink)]">
                    {subs} a month, out of my own pocket.{" "}
                    <span className="font-normal text-[var(--color-ink-soft)]">The fund does not touch these.</span>
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  The subscription lines are not in the ledger right now. NEEDS AUTHENTICATION.
                </p>
              )}
            </div>
            <div className="rounded-2xl border-2 border-[var(--color-gold-bright)] bg-[var(--color-support-soft)]/60 p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-support-strong)]">
                The ask · overage credits
              </p>
              {bill.overage ? (
                <>
                  <p className="mt-1 font-display text-3xl font-black tabular-nums tracking-tight text-[var(--color-ink)]">
                    {usdWhole(bill.overage.amount_cents)}
                    <span className="text-sm font-bold text-[var(--color-muted)]">/mo</span>
                  </p>
                  {bill.overage.blurb ? (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{bill.overage.blurb}</p>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  The overage line is not in the ledger right now. NEEDS AUTHENTICATION.
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
            Same line items I publish on the funding ledger. They change when the bills change, not when I feel
            like it. Every dollar raised here goes to the overage line and nowhere else.
          </p>
          <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3 sm:p-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
              What the tools cost at the sticker · checked {PRICES_CHECKED}
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--color-ink-soft)]">
              {STICKER.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
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
                    It was <strong className="text-[var(--color-ink)]">{caseTotals.daysArrestToPardon.toLocaleString("en-US")} days</strong> from
                    my arrest to my pardon, and then a dismissal with prejudice.{" "}
                  </>
                ) : (
                  <>It was years from my arrest to my pardon, and then a dismissal with prejudice. </>
                )}
                I came home to no business, no marriage, and a record nobody was going to publish for me.
              </p>
              <p>
                So I built the machine that publishes it. Articles. Filings in plain English. Timelines.
                Maps. A profile for every J6 defendant who wants one, free. All of it runs on tokens. The
                subscriptions are mine to pay. The overage is what stops me in the middle of the week.
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

        {/* ── $50 and up: my time ──────────────────────────────────────── */}
        <section id="fuel-time" className="mt-12 scroll-mt-24" aria-labelledby="fuel-time-title">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">The deal</p>
          <h2 id="fuel-time-title" className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Under {floor}, you fuel the machine. {floor} and up, you get me.
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--color-ink-soft)]">
            Writing an article takes real time. The research. The pictures. The back and forth with you until it
            is right. I do not do that for five dollars, and I will not pretend to. Under {floor}, your fuel keeps
            the machine running and your name goes on the wall. At {floor} and up, part of the tank is my time,
            and this is exactly what you get.
          </p>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {timeRows.map((t) => (
              <li
                key={`${t.slug}-${t.monthly ? "m" : "o"}`}
                className={`rounded-2xl border-2 p-4 sm:p-5 ${
                  t.featured
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]/40"
                    : t.monthly
                      ? "border-[var(--color-navy)] bg-[var(--color-blue-soft)]/50"
                      : "border-[var(--color-line)] bg-[var(--color-surface)]"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-2xl font-black tabular-nums tracking-tight text-[var(--color-ink)]">
                    {usdWhole(t.amountCents)}
                    {t.monthly ? <span className="text-sm font-bold text-[var(--color-muted)]">/mo</span> : null}
                  </p>
                  <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">{t.title}</p>
                </div>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {t.gets.map((g) => (
                    <li key={g} className="flex gap-2">
                      <span className="text-[var(--color-accent)]" aria-hidden>
                        ✓
                      </span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/fuel?tier=${t.slug}#fuel`}
                  className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[var(--color-accent)] underline underline-offset-4 sm:min-h-0"
                >
                  {t.monthly ? `Start ${usdWhole(t.amountCents)} a month` : `Fuel ${usdWhole(t.amountCents)}`} →
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
            Every tier includes everything under it. Your name on the wall is optional.
          </p>
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
            <FuelCheckout tiers={bill.tiers} paymentsConfigured={paymentsConfigured} initialTier={sp.tier ?? null} />
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
                Neither company sells that. Your payment goes through Stripe to me, and I buy the credits at the
                published rates. Every dollar shows up on the meter at the top of this page.
              </p>
              <p>
                <strong className="text-[var(--color-ink)]">The subscriptions are not the ask.</strong> I pay
                those myself, every month, and the ledger above shows them so you can see the whole picture. The
                fund exists for the part that runs out.
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
              <Faq q="Why not just buy a bigger plan?">
                There is no bigger plan. Max 20x is the top tier Anthropic sells and Pro 20x is the top at OpenAI,
                and I pay for both. Past the weekly cap the only lane is usage credits at API rates. That is the
                overage, and that is what this buys.
              </Faq>
              <Faq q="How do I know it went to tokens?">
                The meter is public and reads the money as it lands. The rates are public. My subscriptions are
                paid out of my own pocket, so there is nowhere else for the fuel to go but credits. The first
                month that runs on them, the real number goes on this page.
              </Faq>
              <Faq q="What if my topic breaks the rules?">
                I tell you, and I offer another. Public records, public actors, no minors, no private data,
                no invented facts. Same rules as every article on this site.
              </Faq>
              <Faq q="Can I stay anonymous?">
                Yes. Pick it on the form. Your name never touches the wall, and I still read your note.
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
              title="Ryan Nichols pays the AI subscriptions himself. They run dry every half a week and the machine stops. You can keep it running:"
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
