import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getOgImage } from "@/lib/og-images";
import { getJ6DefendantCount } from "@/lib/case";
import { SITE } from "@/lib/site";
import { MapRoomLive } from "@/components/MapRoomLive";
import { MapRoomPatterns } from "@/components/MapRoomPatterns";
import { MapRoomDocket } from "@/components/MapRoomDocket";
import { MapRoomTrail } from "@/components/MapRoomTrail";
import { MapRoomPinnedPost } from "@/components/MapRoomPinnedPost";
import { ShareRail } from "@/components/ShareRail";
import { EMPTY_SITE_TOTALS, fetchSiteTotals } from "@/lib/site-totals";
import { sanitizePings } from "@/lib/radar-pings";

// Rendered per request so the headline number in the HTML — the one a
// reader with JavaScript off sees — is exactly site_totals().live_now at
// that moment, not a cached copy. The two RPCs behind it are cheap.
export const dynamic = "force-dynamic";

const TITLE =
  "The Map Room — the live record of United States v. Nichols and every January 6 defendant who joins";
// The share description carries the defendant count from lib/case.ts, the
// same number every "N defendants indexed" line uses; with no count (0 is
// that helper's "unavailable") it names the archive without one, and
// claims nothing about how complete it is, rather than guess.
function describe(defendants: number): string {
  const counted =
    defendants > 0
      ? `${defendants.toLocaleString("en-US")} J6 defendants archived`
      : "the J6 defendant archive";
  return `Live world map of who's reading the case file right now. Permanent counters: ${counted}, every document, every grievance, every day since the pardon. The full case, in public, free.`;
}

export async function generateMetadata(): Promise<Metadata> {
  const [override, defendants] = await Promise.all([
    getOgImage("/the-map-room"),
    getJ6DefendantCount(),
  ]);
  const DESCRIPTION = describe(defendants);
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

export default async function TheMapRoomPage() {
  const supabase = getSupabaseStaticClient();
  const [totals, pingsRes] = await Promise.all([
    fetchSiteTotals(supabase),
    supabase.rpc("live_visitor_pings"),
  ]);
  const initialTotals = totals ?? EMPTY_SITE_TOTALS;
  // Strip each row to city/state/country before it is serialized into the
  // page: the RPC also carries the session's current path, which never
  // belongs on a public surface.
  const initialPings = sanitizePings(pingsRes.data);

  return (
    <article className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* Map Room leads with the RADAR. No preamble. The visitor's
          first frame is moving dots on a navy command-screen, not a
          headline. The narrative slot lives below the data. */}
      <MapRoomLive initialTotals={initialTotals} initialPings={initialPings} />

      <div className="mt-4">
        <ShareRail
          url={`${SITE.url}/the-map-room`}
          title="Live world map of who's reading the J6 case file right now — realryannichols.com/the-map-room"
        />
      </div>

      <header className="mt-10 max-w-3xl">
        <p className="eyebrow" data-reveal>
          The Map Room · realryannichols.com
        </p>
        <h1
          className="display mt-3 text-4xl sm:text-6xl"
          data-reveal
          style={{ "--d": 1 } as React.CSSProperties}
        >
          The live record of the J6 case.
        </h1>
        <div
          className="mt-5 h-[3px] w-[4.5rem] bg-[var(--color-gold)]"
          aria-hidden
          data-reveal
          style={{ "--d": 2 } as React.CSSProperties}
        />
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

      {/* The Case Nexus banner — the new flagship view. Lands as a
          full-width promo card before the action grid so the visitor
          sees it first. */}
      <Link
        href="/case/nexus"
        className="mt-10 block rounded-2xl border-2 border-[var(--color-blue)] bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface)] to-[var(--color-surface-2)] p-5 sm:p-7 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:from-[var(--color-surface)] hover:via-[var(--color-surface-2)] hover:to-[var(--color-surface-2)] transition"
        data-reveal
      >
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "color-mix(in srgb, var(--color-live) 18%, transparent)" }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-xl">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-gold-bright)] font-bold flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-gold-bright)] animate-pulse" />
              New · The Case Nexus
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight font-display text-[var(--color-ink)]">
              The whole J6 case, on one interactive map.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed">
              Every co-defendant cluster, every defendant, every archived
              document — laid out as a force-directed graph you can drag,
              zoom, and walk. Search a name, click a node, expand the
              network.
            </p>
          </div>
          <span className="text-[var(--color-gold)] font-bold text-sm flex-shrink-0 group-hover:translate-x-1 transition-transform">
            Walk the graph →
          </span>
        </div>
      </Link>

      {/* Action rail — the four permanent invitations. Same shape for
          every visitor; nothing here gates on auth so even a first
          drop-in has a clear next step. */}
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ActionCard
          href="/case"
          accent="gold"
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
          accent="gold"
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

      <section className="panel mt-10 p-5 sm:p-6" data-reveal>
        <p className="eyebrow">
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
            href="/j6"
            className="btn-accent rounded-full px-5 py-2.5 text-sm"
          >
            Ryan&apos;s Jan 6 story →
          </Link>
          <Link
            href="/about"
            className="btn-ghost rounded-full px-5 py-2.5 text-sm"
          >
            About Ryan
          </Link>
          <Link
            href="/book/preorder"
            className="btn-blue rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Get the Book
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
  accent: "gold" | "blue";
  label: string;
  title: string;
  sub: string;
}) {
  // Gold fills take navy ink; blue fills take cream. Naming the hover ink per
  // variant is what keeps the filled state from going cream-on-gold.
  const gold = accent === "gold";
  const ring = gold
    ? "border-[var(--color-gold)] hover:bg-[var(--color-gold)]"
    : "border-[var(--color-blue)] hover:bg-[var(--color-blue)]";
  const hoverInk = gold
    ? "group-hover:text-[var(--color-gold)]"
    : "group-hover:text-[var(--color-cream)]";
  const labelColor = gold
    ? "text-[var(--color-gold)]"
    : "text-[var(--color-blue-ink)]";

  return (
    <Link
      href={href}
      className={`group block rounded-2xl border-2 bg-[var(--color-surface)] p-5 transition ${ring}`}
    >
      <p
        className={`text-[10px] uppercase tracking-wider font-bold ${labelColor} ${hoverInk}`}
      >
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold tracking-tight text-[var(--color-ink)] ${hoverInk} leading-tight`}>
        {title}
      </p>
      <p className={`mt-2 text-xs leading-snug text-[var(--color-ink-soft)] ${hoverInk}`}>
        {sub}
      </p>
    </Link>
  );
}
