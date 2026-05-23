import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getOgImage } from "@/lib/og-images";
import { SITE } from "@/lib/site";
import { MapRoomLive } from "@/components/MapRoomLive";
import { MapRoomPatterns } from "@/components/MapRoomPatterns";
import { MapRoomDocket } from "@/components/MapRoomDocket";
import { MapRoomTrail } from "@/components/MapRoomTrail";
import { MapRoomPinnedPost } from "@/components/MapRoomPinnedPost";
import { ShareRail } from "@/components/ShareRail";

// Tight 30s ISR — the live counts come from the client poll, but the
// SSR'd first paint stays fresh enough that share previews and search
// bots see realistic numbers.
export const revalidate = 30;

const TITLE =
  "The Map Room — the live record of United States v. Nichols and every January 6 defendant who joins";
const DESCRIPTION =
  "Live world map of who's reading the case file right now. Permanent counters: 1,500+ J6 defendants archived, every document, every grievance, every day since the pardon. The full case, in public, free.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/the-map-room");
  const url = `${SITE.url}/the-map-room`;
  // Custom upload wins; otherwise we fall back to the dynamic OG card
  // at /og/map-room so every share embeds the live counters at unfurl
  // time instead of a static placeholder.
  const ogUrl = override?.image_url ?? `${SITE.url}/og/map-room`;
  return {
    title: override?.title ?? "The Map Room",
    description: override?.description ?? DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      url,
      images: [
        {
          url: ogUrl,
          width: override?.width ?? 1200,
          height: override?.height ?? 630,
          alt: TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      images: [ogUrl],
    },
  };
}

type Totals = {
  defendants: number;
  defendants_verified: number;
  documents: number;
  grievances: number;
  events: number;
  days_since_pardon: number;
  days_since_dismissal: number;
  live_now: number;
  countries_now: number;
};

export default async function TheMapRoomPage() {
  const supabase = getSupabaseStaticClient();
  const { data: totals } = await supabase.rpc("site_totals");

  const initialTotals: Totals = (totals as Totals | null) ?? {
    defendants: 0,
    defendants_verified: 0,
    documents: 0,
    grievances: 0,
    events: 0,
    days_since_pardon: 0,
    days_since_dismissal: 0,
    live_now: 0,
    countries_now: 0,
  };

  return (
    <article className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* Map Room leads with the RADAR. No preamble. The visitor's
          first frame is moving dots on a navy command-screen, not a
          headline. The narrative slot lives below the data. */}
      <MapRoomLive initialTotals={initialTotals} />

      <div className="mt-4">
        <ShareRail
          url={`${SITE.url}/the-map-room`}
          title="Live world map of who's reading the J6 case file right now — realryannichols.com/the-map-room"
        />
      </div>

      <header className="mt-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          The Map Room · realryannichols.com
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] font-display">
          The live record of the J6 case.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
          <em>United States v. Nichols.</em> <strong>Pardoned</strong> by
          President Trump on January 20, 2025. Charges{" "}
          <strong>dismissed with prejudice</strong> by U.S. Attorney
          Edward R. Martin Jr. The case cannot be brought again. This
          room holds the running record — every defendant, every
          document, every person who came to read it. In public. Free.
          No algorithm.
        </p>
      </header>

      {/* Action rail — the four permanent invitations. Same shape for
          every visitor; nothing here gates on auth so even a first
          drop-in has a clear next step. */}
      <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ActionCard
          href="/case"
          accent="accent"
          label="The full archive"
          title="Read the case file"
          sub="Every grievance, every named official, every event, every document. 600+ scans."
        />
        <ActionCard
          href="/j6"
          accent="blue"
          label="J6 defendants"
          title="Find your name"
          sub="Free profile for every J6 defendant. Claim it. Build your case in your own words."
        />
        <ActionCard
          href="/submit"
          accent="accent"
          label="Tip line"
          title="Send a receipt"
          sub="Anonymous. Free. Photos, docs, names, stories. Ryan reads every one."
        />
        <ActionCard
          href="/the-harassment"
          accent="blue"
          label="The harassment wall"
          title="Brigades, bans, threats"
          sub="The running ledger of every coordinated attack — kept in public, dated, sourced."
        />
      </section>

      <section className="mt-10 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          What you&apos;re looking at
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
          A war-room for a case that won&apos;t close on its own.
        </h2>
        <div className="mt-3 prose-body text-sm sm:text-base">
          <p>
            The pardon ended the prosecution. It did not end the record.
            This site is the public memory of what was done — the
            grievances filed and ignored, the officials who weaponized the
            DOJ, the J6 defendants still untangling years of lost time.
            More importantly, it is a tool the rest of them can use.
          </p>
          <p>
            Every J6 defendant on the imported list has a profile waiting
            here, free, forever. They claim it. They tell their story in
            their own words. They upload their own evidence. The case
            archive grows defendant by defendant into something the
            previous administration cannot hide.
          </p>
          <p>
            The counters above move every day. The dots on the map move
            every minute. <strong>If you can read this, you&apos;re part
            of the record.</strong>
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/jan-6"
            className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
          >
            Ryan&apos;s Jan 6 story →
          </Link>
          <Link
            href="/about"
            className="rounded-full border-2 border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)]"
          >
            About Ryan
          </Link>
          <Link
            href="/support"
            className="rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
          >
            Back the work
          </Link>
        </div>
      </section>

      {/* Slice 2 — the four sections that turn the Map Room from a
          landing page into a destination people return to: patterns
          hidden in the existing archive, today's docket (what hit the
          record in the last 24h), trail of the week (what people are
          actually reading), and Ryan's most-recent post embedded
          inline so the human stays in frame. */}
      <MapRoomPatterns />
      <MapRoomDocket />
      <MapRoomTrail />
      <MapRoomPinnedPost />
    </article>
  );
}

function ActionCard({
  href,
  accent,
  label,
  title,
  sub,
}: {
  href: string;
  accent: "accent" | "blue";
  label: string;
  title: string;
  sub: string;
}) {
  const ring =
    accent === "accent"
      ? "border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)]"
      : "border-[var(--color-blue)] hover:bg-[var(--color-blue)] hover:text-[var(--color-paper)]";
  const labelColor =
    accent === "accent"
      ? "text-[var(--color-accent)] group-hover:text-[var(--color-paper)]"
      : "text-[var(--color-blue)] group-hover:text-[var(--color-paper)]";

  return (
    <Link
      href={href}
      className={`group block rounded-2xl border-2 bg-[var(--color-surface)] p-5 transition ${ring}`}
    >
      <p
        className={`text-[10px] uppercase tracking-wider font-bold ${labelColor}`}
      >
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-paper)] leading-tight">
        {title}
      </p>
      <p className="mt-2 text-xs leading-snug text-[var(--color-ink-soft)] group-hover:text-[var(--color-paper)]">
        {sub}
      </p>
    </Link>
  );
}
