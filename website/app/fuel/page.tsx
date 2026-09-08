import Link from "next/link";
import localFont from "next/font/local";
import { pageMetadata } from "@/lib/page-metadata";
import { FuelCheckout } from "@/components/FuelCheckout";
import { FuelQuickPick } from "@/components/FuelQuickPick";
import { FuelMeter } from "@/components/FuelMeter";
import { FuelLadder } from "@/components/FuelLadder";
import { FuelCinema } from "@/components/fuel/FuelCinema";
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
import "./fuel.css";

export const dynamic = "force-dynamic";

// The display face for this room only: Big Shoulders, the condensed cut Ryan
// picked for the cover-art standard on /the-story. Self-hosted (OFL), one
// variable file, the latin range, ~35 KB.
const display = localFont({
  src: "./fonts/BigShouldersDisplay-latin.woff2",
  weight: "700 900",
  display: "swap",
  variable: "--font-fuel-display",
});

const DESCRIPTION =
  "Ryan pays the AI subscriptions himself. They run dry every half a week. The Token Fund buys the overage credits that keep the machine running, and what a dollar buys is arithmetic on published rates. Put in enough and he does some of the work for you.";

export const metadata = pageMetadata({
  title: "Fuel the Machine: the Token Fund",
  description: DESCRIPTION,
  path: "/fuel",
  image: "/og/fuel",
});

// Real photos, the same files /the-story uses, with the same provenance.
type Picture = { base: string; widths: readonly number[]; alt: string };
const PHOTOS = {
  hero: {
    base: "/story/ryan-now",
    widths: [720, 1200],
    alt: "Ryan Nichols today, smiling with a thumbs up in front of a red mural in East Texas",
    credit: "Ryan, 2026",
  },
  built: {
    base: "/story/builder-warehouse",
    widths: [720, 1440],
    alt: "Jose, who worked with Ryan Nichols raising money and buying supplies for Hurricane Harvey victims and first responders, beside a cart stacked with cases of water",
    credit: "Jose, on the Harvey supply run",
  },
  mosaic: { base: "/story/archive-mosaic", widths: [1200, 2400], alt: "" },
  closing: {
    base: "/story/closing-sunset",
    widths: [640, 1080],
    alt: "Ryan Nichols from behind at sunset, his shirt reading Rescue the Universe",
  },
} as const;

function Img({ p, sizes, eager = false }: { p: Picture; sizes: string; eager?: boolean }) {
  const mid = p.widths[Math.min(1, p.widths.length - 1)];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${p.base}-${mid}.jpg`}
      srcSet={p.widths.map((w) => `${p.base}-${w}.jpg ${w}w`).join(", ")}
      sizes={sizes}
      alt={p.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
    />
  );
}

// Public archives the machine built. Only real routes on this site.
const SITES_BUILT = [
  { name: "Premier Dental Academy of Longview", href: "https://premierdentalacademyoflongview.com", note: "A school's site, start to finish" },
  { name: "The LeadFlow Pro", href: "https://theleadflowpro.com", note: "Where client builds are delivered" },
  { name: "RepWatchr", href: "/store", note: "Reputation watch tool" },
  { name: "SellerProof", href: "/store", note: "Seller verification tool" },
];

// How one article works, in Ryan's own order.
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
  { title: "Websites", body: "A whole site, start to finish, on a domain you own.", href: "/services", cta: "See the builds" },
  { title: "Funnels and lead systems", body: "Pages that capture a call, a signup, or a sale, then follow up without you.", href: "/services", cta: "How a build works" },
  { title: "Tools", body: "The Records & Bodycam Request Generator, share cards, embeds. Free, no signup.", href: "/tools", cta: "Use them" },
  { title: "Investigations and research", body: "Screenshots, filings, timelines, and public records turned into a case file nobody can wave away.", href: "/case-builder", cta: "Build a case file" },
  { title: "Connecting people", body: "A free profile for every J6 defendant, and a place to tell your story when nobody else will run it.", href: "/tell-your-story", cta: "Tell yours" },
  { title: "Answers", body: "A question you did not know how to find the answer to, researched and answered in public.", href: "#deal", cta: `Ask one at ${usdWhole(FUEL_TIME_FLOOR_CENTS)}` },
];

// Sticker prices behind the ledger, read off the vendors' own pages on the
// date below. Update the date when you re-check them; never guess a price.
const PRICES_CHECKED = "September 7, 2026";
const STICKER = [
  "Claude Max: $100 a month for 5x Pro usage, $200 a month for 20x, each with a five-hour session limit and a weekly limit. There is no bigger plan. Past the limits, usage credits at standard API rates.",
  `${FABLE_RATES.model} by the token: $${FABLE_RATES.input} per million in, $${FABLE_RATES.cacheRead} per million cached, $${FABLE_RATES.output} per million out.`,
  "ChatGPT Pro: $100 a month for 5x Plus usage, $200 for 20x. Past the limit, extra credits, metered by the token.",
];

const MEASURED_DAYS = [
  { label: "A light day", cents: MEASURED_DAY_CENTS.light },
  { label: "My average day", cents: MEASURED_DAY_CENTS.average },
  { label: "A heavy day", cents: MEASURED_DAY_CENTS.heavy },
  { label: "The heaviest day in the log", cents: MEASURED_DAY_CENTS.heaviest },
];

const STOPS = [
  { id: "tank", label: "The tank, live" },
  { id: "does", label: "What your fuel does" },
  { id: "math", label: "The math, in the open" },
  { id: "why-articles", label: "Why articles" },
  { id: "more", label: "Not just articles" },
  { id: "built", label: "What it already built" },
  { id: "ledger", label: "Where the money goes" },
  { id: "why", label: "Why I ask" },
  { id: "deal", label: "The deal" },
  { id: "fuel", label: "Fuel the machine" },
  { id: "wall", label: "The Fuel wall" },
];

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

const d = (n: number) => ({ "--d": n }) as React.CSSProperties;

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
  const floor = usdWhole(FUEL_TIME_FLOOR_CENTS);
  const days = caseTotals?.daysArrestToPardon ?? 0;

  const timeRows = [
    ...timeTiers(bill.tiers).map((t) => ({ ...t, monthly: false })),
    { ...FUEL_MONTHLY, monthly: true },
  ].sort((a, b) => a.amountCents - b.amountCents || (a.monthly ? 1 : -1));

  const mathRows = [...bill.tiers, FUEL_MONTHLY]
    .map((t) => ({ ...t, buy: tokensFor(t.amountCents), time: machineTimeLabel(t.amountCents) }))
    .sort((a, b) => a.amountCents - b.amountCents);

  const built = [
    output.posts30 !== null && output.posts30 > 0 ? { value: output.posts30, label: "articles, last 30 days", href: "/" } : null,
    output.defendants > 0 ? { value: output.defendants, label: "J6 profiles, free to every defendant", href: "/j6" } : null,
    output.documents > 0 ? { value: output.documents, label: "case documents on the record", href: "/case?view=documents" } : null,
    output.totalViews > 0 ? { value: output.totalViews, label: "total reach, every page ever loaded", href: "/the-map-room" } : null,
  ].filter((r): r is { value: number; label: string; href: string } => r !== null);

  return (
    <main className={`ft-theater ${display.variable}`}>
      <FuelCinema stops={STOPS} />

      {/* ---- Title card ---- */}
      <header className="ft-hero" id="fuel-top">
        <div className="ft-hero-media">
          <Img p={PHOTOS.hero} sizes="100vw" eager />
          <span className="ft-prov ft-prov--hero">Real photo · {PHOTOS.hero.credit}</span>
        </div>
        <div className="ft-hero-copy">
          <p className="ft-kicker">The Token Fund · Fuel the machine</p>
          <h1>
            <span className="ft-line" style={{ "--i": 0 } as React.CSSProperties}>
              <span>I run out</span>
            </span>
            <span className="ft-line" style={{ "--i": 1 } as React.CSSProperties}>
              <span>of tokens</span>
            </span>
            <span className="ft-line" style={{ "--i": 2 } as React.CSSProperties}>
              <span>
                every <em>half a week.</em>
              </span>
            </span>
          </h1>
          <div className="ft-rule" aria-hidden />
          <p className="ft-sub">
            Every article, filing summary, map, timeline, and defendant profile on this site is built with AI
            tokens.{" "}
            {subs ? (
              <>
                The subscriptions, <strong>{subs} a month</strong> for {subsNames}, are on me.
              </>
            ) : (
              <>The subscriptions are on me.</>
            )}{" "}
            What runs dry is the included usage, usually by the middle of the week. Past that, the only lane
            either company sells is usage credits, billed by the token at published rates.
            {target ? (
              <>
                {" "}
                Your fuel buys those credits. That is the whole ask:{" "}
                <strong>{target} a month in overage credits</strong> keeps the machine running all week.
              </>
            ) : null}
          </p>
          <ul className="ft-stats">
            {bill.subscriptionCents > 0 ? (
              <li className="ft-stat">
                <b>
                  $<span data-count={Math.round(bill.subscriptionCents / 100)}>{Math.round(bill.subscriptionCents / 100).toLocaleString("en-US")}</span>
                </b>
                <span>Subscriptions, paid by me</span>
              </li>
            ) : null}
            {hasTarget ? (
              <li className="ft-stat">
                <b>
                  $<span data-count={Math.round(bill.targetCents / 100)}>{Math.round(bill.targetCents / 100).toLocaleString("en-US")}</span>
                </b>
                <span>The ask, overage a month</span>
              </li>
            ) : null}
            {output.posts30 !== null && output.posts30 > 0 ? (
              <li className="ft-stat">
                <b data-count={output.posts30}>{output.posts30.toLocaleString("en-US")}</b>
                <span>Articles, last 30 days</span>
              </li>
            ) : null}
          </ul>
          <div className="ft-actions">
            <a href="#fuel" className="ft-btn ft-btn--gold">
              Fuel the overage
            </a>
            <a href="#math" className="ft-btn ft-btn--ghost">
              See the math
            </a>
          </div>
          <a className="ft-scrollcue" href="#tank">
            <i aria-hidden />
            The tank, live
          </a>
        </div>
      </header>

      <ol className="ft-chapters">
        {/* ---- 01 The tank ---- */}
        <li id="tank" data-chapter={1} className="ft-chapter">
          <span className="ft-num" aria-hidden>01</span>
          <div className="ft-copy" data-reveal>
            <p className="ft-era">Chapter one · The tank</p>
            <h2>
              You buy the overage. <em>I do the work.</em>
            </h2>
            <div className="ft-lines">
              <p className="ft-big">Put in enough and I do some of it for you.</p>
              <p>
                The meter reads the money as it lands, every twenty seconds, in front of you. One tap picks the
                amount. Stripe takes the card. No account, no app, no middleman. Monthly stops whenever you say.
              </p>
            </div>
            {sp.canceled ? (
              <p className="mt-4 max-w-xl rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-[var(--ft-mist)]">
                No charge was made. Pick up where you left off whenever you want.
              </p>
            ) : null}
          </div>
          <div className="ft-slab" data-reveal style={d(1)}>
            {hasTarget ? <FuelMeter initial={status} /> : null}
            <div className={hasTarget ? "mt-5" : ""}>
              <FuelQuickPick tiers={bill.tiers} />
            </div>
          </div>
        </li>

        {/* ---- 02 What your fuel does ---- */}
        <li id="does" data-chapter={2} className="ft-chapter ft-chapter--split">
          <span className="ft-num" aria-hidden>02</span>
          <div className="ft-copy" data-reveal>
            <p className="ft-era">Chapter two · What your fuel does</p>
            <h2>
              {usdWhole(500)} is {roundWords(five.words)} words. <em>{usdWhole(5_000)} is {fifty?.replace(" of the machine", "")}.</em>
            </h2>
            <div className="ft-lines">
              <p className="ft-big">Not a metaphor.</p>
              <p>
                Anthropic publishes the price of every token. The mix of tokens is measured off my own machine.
                Every bar is that arithmetic, and it is labeled an estimate because a tokens-per-article meter
                does not exist yet.
              </p>
            </div>
            <div className="ft-chips">
              <span className="ft-chip ft-chip--fact">Fact · Anthropic rate card</span>
              <span className="ft-chip ft-chip--fact">Fact · measured on my Mac</span>
              <span className="ft-chip ft-chip--estimate">Estimate</span>
            </div>
            <a href="#math" className="ft-cta">
              The arithmetic, line by line <span aria-hidden>→</span>
            </a>
          </div>
          <div className="ft-side ft-panel" data-reveal style={d(1)}>
            <FuelLadder tiers={bill.tiers} />
          </div>
        </li>

        {/* ---- 03 The math, in the open ---- */}
        <li id="math" data-chapter={3} className="ft-chapter ft-chapter--bleed ft-chapter--math">
          <div className="ft-bleed-bg" aria-hidden>
            <Img p={PHOTOS.mosaic} sizes="140vw" />
            <span className="ft-prov ft-prov--paper">Court scans · my own paper, behind the numbers</span>
          </div>
          <span className="ft-num" aria-hidden>03</span>
          <div className="ft-bleed-inner">
            <div className="ft-copy" data-reveal>
              <p className="ft-era">Chapter three · The math, in the open</p>
              <h2>
                A dollar is a number of tokens. <em>Here is the arithmetic.</em>
              </h2>
              <div className="ft-lines">
                <p>
                  Two inputs, both with a source, and nothing else. Anthropic publishes the price of every token.
                  I measured the mix of tokens my own work burns. Multiply, and a dollar becomes words and hours.
                  Nobody has metered a single article yet, so every figure here is an estimate and says so. The
                  first month that runs on credits, the real number replaces it.
                </p>
              </div>
              <div className="ft-tiles ft-tiles--2 mt-6" style={{ gridTemplateColumns: "1fr" }}>
                <div className="ft-tile">
                  <em>Input 1 · the rate card</em>
                  <b>{FABLE_RATES.model}</b>
                  <small>
                    ${FABLE_RATES.input} per million tokens in, ${FABLE_RATES.cacheRead} per million cached, ${FABLE_RATES.output} per
                    million out. Read from Anthropic&apos;s pricing page on {FABLE_RATES.checkedOn}. Usage credits are
                    billed at exactly these rates.
                  </small>
                </div>
                <div className="ft-tile">
                  <em>Input 2 · my measured mix</em>
                  <b>
                    {MEASURED_MIX.inputPerOutput} input tokens and {MEASURED_MIX.cacheReadPerOutput} cache reads per output token
                  </b>
                  <small>
                    Measured with ccusage on my own machine, {MEASURED_MIX.window}, {MEASURED_MIX.activeDays} active days.
                    All in, one output token costs about ${perOutput.toFixed(5)}.
                  </small>
                </div>
              </div>
            </div>
            <div className="ft-side ft-panel ft-panel--stack" data-reveal style={d(1)}>
              <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
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
              <div className="grid gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:grid-cols-[1fr_1.2fr]">
                <table className="w-full text-left text-sm">
                  <caption className="pb-2 text-left text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                    What a day of my work costs in credits, from the same log
                  </caption>
                  <tbody className="divide-y divide-[var(--color-line)]">
                    {MEASURED_DAYS.map((m) => (
                      <tr key={m.label}>
                        <td className="py-2 text-[var(--color-ink-soft)]">{m.label}</td>
                        <td className="py-2 text-right font-display text-lg font-black tabular-nums text-[var(--color-ink)]">{usdWhole(m.cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">How the real number gets made</p>
                  <p className="mt-1">
                    Machine time is the gift against my average day, {usdWhole(MEASURED_DAY_CENTS.average)} of tokens over{" "}
                    {WORKING_DAY_HOURS} hours. Words are output tokens times 0.75, reasoning included. Those are the two
                    assumptions, and they are both written down.
                  </p>
                  <p className="mt-2">
                    Turn usage credits on. Run a month. Read the meter. The day a metered article exists, its cost goes
                    here, the word estimate comes off, and every tier re-prices itself from the same file.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </li>

        {/* ---- 04 Why articles ---- */}
        <li id="why-articles" data-chapter={4} className="ft-chapter ft-chapter--split ft-chapter--flip">
          <span className="ft-num" aria-hidden>04</span>
          <div className="ft-copy" data-reveal>
            <p className="ft-era">Chapter four · Why articles</p>
            <h2>
              A post dies in a day. <em>An article is an evergreen billboard.</em>
            </h2>
            <div className="ft-lines">
              <p>
                A post on a feed reaches a sliver of the people who follow you, for about a day, and then it is
                gone. An article on my own domain is there the next time anyone on earth types those words into
                Google. Nobody throttles it. Nobody deletes it. It gets indexed, it ranks, and it keeps working
                while I sleep.
              </p>
              <p>
                Somebody searches the words in the headline. The share card comes up and tells its own story in
                one picture and a few words. Then the title. Then the subheadline. Then the description under the
                picture. They click. Inside is the proof: the records, the dates, the screenshots, the data. Data
                tells a story. Then the forms, the buttons, the links, and the call to action that turn a reader
                into a share, a signup, a call, or a sale.
              </p>
              <p className="ft-big">
                That is one reader the feed was never going to give me.
                {output.posts30 !== null && output.posts30 > 0
                  ? ` Do it ${output.posts30.toLocaleString("en-US")} times in thirty days and you have an archive that widens the audience on its own.`
                  : " Do it every day and you have an archive that widens the audience on its own."}
              </p>
              <p>
                Give me your information and I do the same thing for you. Researched. Written the right way.
                Published on a domain that already ranks. Wired with the forms and buttons that make it pay.{" "}
                <a href="#deal">That starts at {floor}.</a>
              </p>
            </div>
          </div>
          <ol className="ft-side ft-tiles ft-tiles--3" aria-label="How one article works" data-reveal style={d(1)}>
            {BILLBOARD.map((s, i) => (
              <li key={s.t} className="ft-tile">
                <i>{i + 1}</i>
                <b>{s.t}</b>
                <small>{s.s}</small>
              </li>
            ))}
          </ol>
        </li>

        {/* ---- 05 Not just articles ---- */}
        <li id="more" data-chapter={5} className="ft-chapter">
          <span className="ft-num" aria-hidden>05</span>
          <div className="ft-copy" data-reveal>
            <p className="ft-era">Chapter five · Not just articles</p>
            <h2>
              Articles are one thing <em>that comes out of the machine.</em>
            </h2>
            <div className="ft-lines">
              <p className="ft-big">
                I build sites. I build funnels. I build tools. I run investigations and research. I connect
                people who need each other. I find answers to questions you did not know how to ask.
              </p>
              <p>All of it runs on the same tokens.</p>
            </div>
          </div>
          <ul className="ft-tiles ft-tiles--2" data-reveal style={d(1)}>
            {MACHINE_DOES.map((m) => (
              <li key={m.title}>
                <Link href={m.href} className="ft-tile">
                  <b>{m.title}</b>
                  <small>{m.body}</small>
                  <em>{m.cta} →</em>
                </Link>
              </li>
            ))}
          </ul>
        </li>

        {/* ---- 06 What it already built ---- */}
        {built.length > 0 ? (
          <li id="built" data-chapter={6} className="ft-chapter ft-chapter--bleed ft-chapter--built">
            <div className="ft-bleed-bg" aria-hidden>
              <Img p={PHOTOS.built} sizes="100vw" />
              <span className="ft-prov">Real photo · {PHOTOS.built.credit}</span>
            </div>
            <span className="ft-num" aria-hidden>06</span>
            <div className="ft-bleed-inner ft-bleed-inner--split">
              <div className="ft-copy" data-reveal>
                <p className="ft-era">Chapter six · What the machine already built</p>
                <h2>
                  Not a promise. <em>A record you can open.</em>
                </h2>
                <div className="ft-lines">
                  <p>
                    Every one of these came out of the machine. None of it exists without tokens, and none of it
                    was written by a staff. It was me, at a keyboard, with the tools this fund keeps running.
                  </p>
                  <p>
                    The same system builds sites, tools, and archives for businesses and people who want to own
                    their platform.{" "}
                    <Link href="/services">That is the paid side.</Link> The fuel keeps the free side alive.
                  </p>
                </div>
                <div className="ft-chips">
                  {SITES_BUILT.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      className="ft-chip"
                      target={s.href.startsWith("http") ? "_blank" : undefined}
                      rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {s.name} · {s.note}
                    </a>
                  ))}
                </div>
              </div>
              <div className="ft-bignums ft-side" data-reveal style={d(1)}>
                {built.map((b) => (
                  <div className="ft-bignum" key={b.label}>
                    <Link href={b.href}>
                      <b data-count={b.value}>{b.value.toLocaleString("en-US")}</b>
                      <span>{b.label} →</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </li>
        ) : null}

        {/* ---- 07 Where the money goes ---- */}
        <li id="ledger" data-chapter={7} className="ft-chapter ft-chapter--split">
          <span className="ft-num" aria-hidden>07</span>
          <div className="ft-copy" data-reveal>
            <p className="ft-era">Chapter seven · Where the money goes</p>
            <h2>
              {target ? (
                <>
                  {target} a month in overage credits. <em>That is the ask.</em>
                </>
              ) : (
                <>The ask, from the ledger.</>
              )}
            </h2>
            <div className="ft-lines">
              <p>
                Same line items I publish on the funding ledger. They change when the bills change, not when I
                feel like it. Every dollar raised here goes to the overage line and nowhere else.
              </p>
              <p className="ft-big">The subscriptions are not the ask. I pay those myself, every month.</p>
              <p>
                <strong>There is no button that puts tokens into my Claude or ChatGPT account.</strong> Neither
                company sells that. Your payment goes through Stripe to me, and I buy the credits at the published
                rates. Every dollar shows up on the meter at the top of this page.
              </p>
            </div>
          </div>
          <div className="ft-side ft-panel ft-panel--stack" data-reveal style={d(1)}>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">What I pay myself · not the ask</p>
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
                <p className="mt-2 text-sm text-[var(--color-muted)]">The subscription lines are not in the ledger right now. NEEDS AUTHENTICATION.</p>
              )}
            </div>
            <div className="rounded-2xl border-2 border-[var(--color-gold-bright)] bg-[var(--color-support-soft)] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-support-strong)]">The ask · overage credits</p>
              {bill.overage ? (
                <>
                  <p className="mt-1 font-display text-3xl font-black tabular-nums tracking-tight text-[var(--color-ink)]">
                    {usdWhole(bill.overage.amount_cents)}
                    <span className="text-sm font-bold text-[var(--color-muted)]">/mo</span>
                  </p>
                  {bill.overage.blurb ? <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{bill.overage.blurb}</p> : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--color-muted)]">The overage line is not in the ledger right now. NEEDS AUTHENTICATION.</p>
              )}
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                What the tools cost at the sticker · checked {PRICES_CHECKED}
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                {STICKER.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </li>

        {/* ---- 08 Why I ask ---- */}
        <li id="why" data-chapter={8} className="ft-chapter ft-chapter--split">
          <span className="ft-num" aria-hidden>08</span>
          <div className="ft-copy" data-reveal>
            <p className="ft-era">Chapter eight · Why I ask</p>
            <h2>
              I would rather earn it. <em>This is the closest thing I have.</em>
            </h2>
            <div className="ft-lines">
              <p>
                {days > 0 ? (
                  <>
                    It was <strong>{days.toLocaleString("en-US")} days</strong> from my arrest to my pardon, and then a
                    dismissal with prejudice.{" "}
                  </>
                ) : (
                  <>It was years from my arrest to my pardon, and then a dismissal with prejudice. </>
                )}
                I came home to no business, no marriage, and a record nobody was going to publish for me.
              </p>
              <p>
                So I built the machine that publishes it. Articles. Filings in plain English. Timelines. Maps. A
                profile for every J6 defendant who wants one, free. All of it runs on tokens. The subscriptions are
                mine to pay. The overage is what stops me in the middle of the week.
              </p>
              <p className="ft-big">This is not a handout. It is work, fueled in public.</p>
              <p>You put fuel in, the work gets done, and you get a piece of it back.</p>
            </div>
            <p className="ft-verse">&ldquo;You meant evil against me, but God meant it for good.&rdquo; Genesis 50:20</p>
          </div>
          <div className="ft-side" data-reveal style={d(1)}>
            <div className="ft-tile" style={{ padding: "1.25rem" }}>
              <em>Where the next tank goes</em>
              <ul className="mt-3 space-y-4 text-sm">
                <li>
                  <Link href="/j6" className="font-bold text-[var(--ft-cream)] underline decoration-[var(--ft-gold)] underline-offset-4">
                    Every J6 defendant on the record
                  </Link>
                  <span className="mt-0.5 block text-[var(--ft-mist)]">A free profile for every one who wants it. No family pays for that here.</span>
                </li>
                <li>
                  <Link href="/book/preorder" className="font-bold text-[var(--ft-cream)] underline decoration-[var(--ft-gold)] underline-offset-4">
                    Fighting Shadows, the book
                  </Link>
                  <span className="mt-0.5 block text-[var(--ft-mist)]">The whole story, with receipts, on the way out the door.</span>
                </li>
                <li>
                  <a href="#fuel" className="font-bold text-[var(--ft-cream)] underline decoration-[var(--ft-gold)] underline-offset-4">
                    The next commissioned article
                  </a>
                  <span className="mt-0.5 block text-[var(--ft-mist)]">Could be yours. Pick the topic at the {usdWhole(50000)} tier.</span>
                </li>
              </ul>
            </div>
          </div>
        </li>
      </ol>

      {/* ---- The paper comes back: the deal, the form, straight talk ---- */}
      <section className="ft-paper" id="deal" data-chapter={9}>
        <div>
          <div className="ft-paper-block">
            <p className="ft-kicker">The deal</p>
            <h2>
              Under {floor}, you fuel the machine. <em>{floor} and up, you get me.</em>
            </h2>
            <p className="ft-lead">
              Writing an article takes real time. The research. The pictures. The back and forth with you until it
              is right. I do not do that for five dollars, and I will not pretend to. Under {floor}, your fuel keeps
              the machine running and your name goes on the wall. At {floor} and up, part of the tank is my time, and
              this is exactly what you get.
            </p>
            <ol className="mt-6 grid gap-3 md:grid-cols-2">
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
          </div>

          <div className="ft-paper-block scroll-mt-24" id="fuel" data-chapter={10}>
            <p className="ft-kicker">Fuel the machine</p>
            <h2>
              Pick your fuel. <em>Every tier includes everything below it.</em>
            </h2>
            <p className="ft-lead">
              Floor is {usdWhole(FUEL_FLOOR_CENTS)}. Card fees are real, and under that the fee starts winning. Above
              it, it is your call. Or make it {usdWhole(FUEL_MONTHLY.amountCents)} a month and become a Keeper.
            </p>
            <div className="mt-6 rounded-3xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-6">
              <FuelCheckout tiers={bill.tiers} paymentsConfigured={paymentsConfigured} initialTier={sp.tier ?? null} />
            </div>
          </div>

          <div className="ft-paper-block grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">Straight talk about where it goes</h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                <p>
                  <strong className="text-[var(--color-ink)]">There is no button that puts tokens into my Claude or ChatGPT account.</strong>{" "}
                  Neither company sells that. Your payment goes through Stripe to me, and I buy the credits at the
                  published rates.
                </p>
                <p>
                  <strong className="text-[var(--color-ink)]">What you get is work, not merchandise.</strong> A question
                  answered in public. A letter. An article on a topic you pick, researched and published under the
                  same rules as everything else here: public records, public actors, no minors, no private data, no
                  invented facts.
                </p>
                <p>
                  <strong className="text-[var(--color-ink)]">Receipts come from Stripe.</strong> This is a payment to a
                  person, not a charitable donation.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">Questions people ask</h3>
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
                  I tell you, and I offer another. Public records, public actors, no minors, no private data, no
                  invented facts. Same rules as every article on this site.
                </Faq>
                <Faq q="Can I stay anonymous?">
                  Yes. Pick it on the form. Your name never touches the wall, and I still read your note.
                </Faq>
                <Faq q="How does monthly work, and how do I stop it?">
                  Stripe charges {usdWhole(FUEL_MONTHLY.amountCents)} on the same day each month. Write to me any time
                  and I end it; the last month billed is the last charge.
                </Faq>
                <Faq q="I cannot give right now. What helps?">
                  Put the record in front of one more person. The share buttons below do that in one tap, and every
                  reader who lands here is a reader the algorithms did not get to throttle.
                </Faq>
              </div>
            </div>
          </div>

          <div className="ft-paper-block">
            <p className="ft-kicker">Not today?</p>
            <h2>Put this in front of one more person.</h2>
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
          </div>
        </div>
      </section>

      {/* ---- The wall ---- */}
      <section className="ft-closing" id="wall" data-chapter={11}>
        <div className="ft-closing-bg" aria-hidden>
          <Img p={PHOTOS.closing} sizes="100vw" />
        </div>
        <div className="ft-closing-inner">
          <p className="ft-kicker">The Fuel wall</p>
          <h2 data-reveal>
            {wall.length > 0 ? (
              <>
                The people <em>keeping the lights on.</em>
              </>
            ) : (
              <>
                The first names <em>go here.</em>
              </>
            )}
          </h2>
          {keepers.length > 0 ? (
            <ul className="ft-wall" data-reveal style={d(1)} aria-label="Keepers">
              {keepers.map((s) => (
                <li key={s.id} className="is-keeper">
                  <small>Keeper</small>
                  {s.display_name ?? "Anonymous"}
                </li>
              ))}
            </ul>
          ) : null}
          {others.length > 0 ? (
            <ul className="ft-wall" data-reveal style={d(2)} aria-label="Fuelers">
              {others.map((s) => (
                <li key={s.id}>
                  {s.display_name ?? "Anonymous"}
                  {s.amount ? <small>${s.amount}</small> : null}
                  {s.fuel?.tier ? <small>{s.fuel.tier}</small> : null}
                  {/founding/i.test(s.fuel?.tier ?? "") ? <em>Founding</em> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {wall.length === 0 ? (
            <p className="ft-note" data-reveal style={d(1)}>
              Nobody has fueled this tank yet. The first name on this wall is the one people will remember, and I
              will remember it in writing. <a href="#fuel">Be first.</a>
            </p>
          ) : null}
          <div className="ft-actions" data-reveal style={d(2)}>
            <a href="#fuel" className="ft-btn ft-btn--gold">
              Fuel the overage
            </a>
            <Link href="/the-map-room" className="ft-btn ft-btn--ghost">
              Watch the machine run
            </Link>
          </div>
          <p className="ft-verse">
            &ldquo;As for you, you meant evil against me, but God meant it for good, to bring it about that many
            people should be kept alive, as they are today.&rdquo; Genesis 50:20
          </p>
        </div>
      </section>
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
