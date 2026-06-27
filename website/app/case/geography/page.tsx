import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getOgImage } from "@/lib/og-images";
import { SITE } from "@/lib/site";
import { CaseGeographyMap, type GeoPayload } from "@/components/CaseGeographyMap";
import { ShareRail } from "@/components/ShareRail";
import { ReactionBar } from "@/components/ReactionBar";

export const revalidate = 300;

const TITLE =
  "Where the J6 defendants came from — state-by-state map of every Capitol Breach prosecution";
const DESCRIPTION =
  "A choropleth of every January 6 defendant by home state. Florida, Texas, Pennsylvania — the prosecution wave by geography, click any state to see its names.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/case/geography");
  const url = `${SITE.url}/case/geography`;
  const ogUrl = override?.image_url ?? `${SITE.url}/og/site`;
  return {
    title: override?.title ?? "J6 Geography",
    description: override?.description ?? DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      url,
      images: ogUrl
        ? [
            {
              url: ogUrl,
              width: override?.width ?? 1200,
              height: override?.height ?? 630,
              alt: TITLE,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogUrl ? "summary_large_image" : "summary",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      images: ogUrl ? [ogUrl] : undefined,
    },
  };
}

export default async function CaseGeographyPage() {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase.rpc("case_geo_aggregate");
  const payload: GeoPayload = (data as GeoPayload | null) ?? {
    states: [],
    totals: { with_location: 0, distinct_states: 0, all_j6: 0 },
  };

  const ranked = [...payload.states].sort((a, b) => b.defendants - a.defendants);
  const maxDef = ranked.reduce((m, s) => Math.max(m, s.defendants), 1);
  const topState = ranked[0];

  return (
    <article className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="max-w-3xl mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#e1bd5b] font-bold">
          The Geography · realryannichols.com
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] font-display">
          They came from every state.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
          Every January 6 defendant the previous DOJ prosecuted, plotted
          to their home state. Florida and Texas led the country in
          arrests. Click any state to see its names and walk back to
          their profiles.
        </p>
      </header>

      {/* ---- Stat band ---- */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <GeoStat n={payload.totals.all_j6} label="Defendants prosecuted" sub="The full wave" />
        <GeoStat n={payload.totals.distinct_states} label="States represented" sub="Plus D.C." />
        <GeoStat n={payload.totals.with_location} label="Plotted on the map" sub="Located to a state" />
        <GeoStat
          n={topState?.defendants ?? 0}
          label={topState ? `Most: ${topState.name}` : "Most arrests"}
          sub="Leading the country"
        />
      </section>

      <CaseGeographyMap data={payload} />

      <div className="mt-6">
        <ShareRail
          url={`${SITE.url}/case/geography`}
          title="Every J6 defendant by home state — the prosecution wave on the US map: realryannichols.com/case/geography"
        />
      </div>
      <div className="mt-3">
        <ReactionBar targetType="page" targetId="case-geography" />
      </div>

      {/* ---- Leaderboard ---- */}
      {ranked.length > 0 ? (
        <section className="mt-8 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display">
            The prosecution leaderboard
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            States ranked by defendants prosecuted — number sentenced in
            parentheses.
          </p>
          <ol className="mt-4 space-y-2">
            {ranked.slice(0, 12).map((s, i) => (
              <li key={s.name} className="flex items-center gap-2 sm:gap-3">
                <span className="w-5 text-right text-xs font-bold tabular-nums text-[var(--color-muted)]">
                  {i + 1}
                </span>
                <span className="w-24 sm:w-36 flex-shrink-0 text-sm font-bold text-[var(--color-ink)] truncate">
                  {s.name}
                </span>
                <div className="flex-1 h-5 rounded bg-[var(--color-surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded bg-[var(--color-accent)]"
                    style={{ width: `${Math.max(4, (s.defendants / maxDef) * 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-bold tabular-nums text-[var(--color-ink)]">
                  {s.defendants}
                  <span className="text-[var(--color-muted)] font-normal"> ({s.sentenced})</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CrossLink
          href="/case/nexus"
          title="The Case Nexus"
          sub="Force-directed graph of co-defendant clusters."
        />
        <CrossLink
          href="/case/timeline"
          title="The Sentencing Wave"
          sub="Month-by-month chronology of arrests + sentencings."
        />
        <CrossLink
          href="/case/the-salvaged-doj-record"
          title="The salvaged DOJ record"
          sub="The original 1,092 defendants the DOJ scrubbed, preserved."
        />
      </section>
    </article>
  );
}

function GeoStat({ n, label, sub }: { n: number; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-none text-[var(--color-accent)] font-display tabular-nums">
        {n}
      </div>
      <div className="mt-2 text-sm font-bold text-[var(--color-ink)] leading-tight">{label}</div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mt-0.5">
        {sub}
      </div>
    </div>
  );
}

function CrossLink({
  href,
  title,
  sub,
}: {
  href: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition group"
    >
      <p className="text-sm font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {title}
      </p>
      <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">
        {sub}
      </p>
    </Link>
  );
}
