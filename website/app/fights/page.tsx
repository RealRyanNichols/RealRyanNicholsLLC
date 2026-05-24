import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getOgImage } from "@/lib/og-images";
import { ShareRail } from "@/components/ShareRail";
import { ReactionBar } from "@/components/ReactionBar";

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

// Ryan's issue-advocacy — his stated values, framed in his voice. These
// are starting statements he can sharpen; they take positions on issues,
// not on any office or opponent.
const FIGHTS: { tag: string; title: string; body: string }[] = [
  {
    tag: "East Texas",
    title: "Water Rights",
    body: "Water is the lifeblood of East Texas. I'm fighting to keep it in the hands of the people who live on this land — not sold off, piped out to the metros, or controlled over our heads by interests who never set foot here.",
  },
  {
    tag: "Free speech",
    title: "The First Amendment",
    body: "I was banned, brigaded, and prosecuted over speech. No American should lose their voice to an algorithm or a weaponized agency. The First Amendment isn't a technicality — it's the whole ballgame, and I'll defend it for people I agree with and people I don't.",
  },
  {
    tag: "Property",
    title: "Land Rights",
    body: "Your land is your stake in this country. I'm fighting eminent-domain abuse and any government or corporation that treats a family's private property as theirs to take.",
  },
  {
    tag: "Your paycheck",
    title: "Tax Fairness",
    body: "Working people are taxed into the ground while the connected get the carve-outs. I'm fighting for a system that stops punishing the people who actually build everything.",
  },
  {
    tag: "Two-tier no more",
    title: "Equal Justice Under the Law",
    body: "I lived two-tier justice from the inside. Those four words are carved over the Supreme Court — Equal Justice Under Law — and I'm fighting to make them true for everyone, not just whoever the government happens to like that week.",
  },
];

export default function FightsPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="rounded-3xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] p-6 sm:p-10">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-accent)] font-bold">
          The Fights
        </p>
        <h1 className="mt-2 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] font-display">
          Power back to the people.
        </h1>
        <p className="mt-4 text-base sm:text-xl text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
          The system ran me over and called it justice. I came out the other
          side knowing exactly how it treats regular people who don&apos;t have
          the money or the connections to fight back. So I&apos;m fighting —
          for East Texas, and for every American the machine steamrolls. Here&apos;s
          where I&apos;m putting the pressure.
        </p>
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

      <div className="mt-8 space-y-3">
        {FIGHTS.map((f) => (
          <section
            key={f.title}
            className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
              {f.tag}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight font-display">
              {f.title}
            </h2>
            <p className="mt-2 text-base text-[var(--color-ink-soft)] leading-relaxed">
              {f.body}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-6 sm:p-8">
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
            className="rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
          >
            Send a tip →
          </Link>
          <Link
            href="/support"
            className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
          >
            Fuel the fight →
          </Link>
        </div>
      </section>
    </article>
  );
}
