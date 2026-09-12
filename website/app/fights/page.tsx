import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getOgImage } from "@/lib/og-images";
import { ShareRail } from "@/components/ShareRail";
import { ReactionBar } from "@/components/ReactionBar";
import { FIGHTS } from "@/lib/fights";

// Cache + periodically revalidate instead of force-dynamic: the page is
// static content, so caching makes it fast (better SEO/attention) while
// still picking up an admin-set OG image within the window.
export const revalidate = 600;

const TITLE = "The Fights — power back to the people of East Texas";
const DESCRIPTION =
  "The fights Ryan Nichols is taking up: East Texas water rights, the First Amendment, land rights, tax fairness, and equal justice under the law. Power back to the people.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/fights");
  const title = override?.title ?? TITLE;
  const description = override?.description ?? DESCRIPTION;
  const url = `${SITE.url}/fights`;
  const ogImageUrl = override?.image_url ?? null;
  return {
    title: override?.title ?? "The Fights",
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: override?.width ?? 1200,
              height: override?.height ?? 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default function FightsPage() {
  const planksTotal = FIGHTS.reduce((n, f) => n + f.planks.length, 0);
  const receiptsTotal = FIGHTS.reduce((n, f) => n + f.receiptsPosts.length, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* ---- Hero ---- */}
      <div className="rounded-3xl border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-navy)] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <p className="eyebrow" data-reveal>
          The Fights · the war room
        </p>
        <h1
          className="display mt-3 text-5xl sm:text-7xl"
          data-reveal
          style={{ "--d": 1 } as React.CSSProperties}
        >
          Power back to the people.
        </h1>
        <div
          className="mt-5 h-[3px] w-[4.5rem] bg-[var(--color-gold)]"
          aria-hidden
          data-reveal
          style={{ "--d": 2 } as React.CSSProperties}
        />
        <p className="mt-4 text-base sm:text-xl text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
          The system ran me over and called it justice. I came out the other
          side knowing exactly how it treats regular people who don&apos;t have
          the money or the connections to fight back. So I&apos;m fighting — for
          East Texas, and for every American the machine steamrolls. Here&apos;s
          where I&apos;m putting the pressure.
        </p>

        {/* tally band */}
        <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
          <HeroStat n={FIGHTS.length} label="Fights" />
          <HeroStat n={planksTotal} label="Concrete planks" />
          <HeroStat n={receiptsTotal} label="Receipts filed" />
        </div>
      </div>

      <div className="mt-5">
        <ShareRail
          url={`${SITE.url}/fights`}
          title="The fights Ryan Nichols is taking up — East Texas water, the First Amendment, land, taxes, equal justice. Power back to the people: realryannichols.com/fights"
        />
      </div>
      <div className="mt-3">
        <ReactionBar
          targetType="page"
          targetId="the-fights"
          prompt="Which fight matters most to you? Tap — no signup."
        />
      </div>

      {/* ---- The board ---- */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {FIGHTS.map((f) => (
          <Link
            key={f.slug}
            href={`/fights/${f.slug}`}
            className="panel group flex flex-col p-5 sm:p-6 transition hover:border-[var(--color-gold)]"
            data-reveal
          >
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow">
                {f.tag}
              </p>
              <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {f.receiptsPosts.length > 0
                  ? `${f.receiptsPosts.length} receipt${f.receiptsPosts.length === 1 ? "" : "s"}`
                  : "Position stated"}
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight font-display group-hover:text-[var(--color-gold)] transition">
              {f.title}
            </h2>
            <p className="mt-2 border-l-2 border-[var(--color-gold)] pl-3 text-sm text-[var(--color-ink-soft)] italic leading-snug">
              {f.stakes}
            </p>
            <ul className="mt-4 space-y-1.5 flex-1">
              {f.planks.map((p) => (
                <li key={p} className="flex gap-2 text-sm text-[var(--color-ink)] leading-snug">
                  <span className="text-[var(--color-gold)] font-bold flex-shrink-0">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <span className="mt-4 inline-block text-sm font-bold text-[var(--color-gold)] group-hover:underline">
              Read the fight →
            </span>
          </Link>
        ))}
      </div>

      {/* ---- Submit ---- */}
      <section className="mt-10 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]" data-reveal>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display">
          Got a fight that belongs here?
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] max-w-2xl">
          If there&apos;s something happening to people in your town — water,
          land, free speech, a government that won&apos;t answer — send it. I
          read every tip, and the ones with receipts get daylight.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/submit"
            className="btn-blue rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Send a tip →
          </Link>
          <Link
            href="/support"
            className="btn-accent rounded-full px-5 py-2.5 text-sm"
          >
            Fuel the fight →
          </Link>
        </div>
      </section>
    </main>
  );
}

function HeroStat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2.5">
      <div className="display text-3xl sm:text-4xl leading-none text-[var(--color-gold)] tabular-nums">
        {n}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-[var(--color-muted)] font-bold leading-tight">
        {label}
      </div>
    </div>
  );
}
