import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getOgImage } from "@/lib/og-images";
import { SITE } from "@/lib/site";
import { CaseTimeline, type TimelinePayload } from "@/components/CaseTimeline";
import { ShareRail } from "@/components/ShareRail";
import { ReactionBar } from "@/components/ReactionBar";

// 5-minute ISR — the timeline shifts only when new defendants get
// matched in or claimants edit their pages.
export const revalidate = 300;

const TITLE =
  "The J6 Sentencing Wave — every Capitol Breach defendant on the time axis";
const DESCRIPTION =
  "Every January 6 sentencing and arrest the previous DOJ ran, laid out month by month. The full prosecution wave you can scroll through, search, and walk back to the original case.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/case/timeline");
  const url = `${SITE.url}/case/timeline`;
  const ogUrl = override?.image_url ?? null;
  return {
    title: override?.title ?? "The J6 Sentencing Wave",
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

export default async function CaseTimelinePage() {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase.rpc("case_timeline_data");
  const payload: TimelinePayload = (data as TimelinePayload | null) ?? {
    rows: [],
    histograms: { sentencings: [], arrests: [] },
    totals: { all_j6: 0, with_arrest: 0, with_plea: 0, with_sentence: 0 },
  };

  return (
    <article className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <header className="max-w-3xl mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#e1bd5b] font-bold">
          The Timeline · realryannichols.com
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] font-display">
          The prosecution wave, month by month.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
          Every J6 sentencing and arrest the Biden DOJ landed on the
          public record — laid out on the time axis. Toggle between
          sentencings and arrests. Click a year to filter. Tap a defendant
          to walk back to their profile.
        </p>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Data sourced from the salvaged DOJ Capitol Breach Cases listing
          ({payload.totals.with_arrest.toLocaleString()} arrests,
          {" "}{payload.totals.with_sentence.toLocaleString()} sentencings on
          file) and enriched per defendant on{" "}
          <Link
            href="/case/the-salvaged-doj-record"
            className="underline underline-offset-4 hover:text-[var(--color-accent)]"
          >
            the salvaged record
          </Link>
          .
        </p>
      </header>

      <CaseTimeline data={payload} />

      <div className="mt-6">
        <ShareRail
          url={`${SITE.url}/case/timeline`}
          title="The J6 sentencing wave — every prosecution on the time axis: realryannichols.com/case/timeline"
        />
      </div>
      <div className="mt-3">
        <ReactionBar targetType="page" targetId="case-timeline" />
      </div>

      {/* Cross-links to the other lenses */}
      <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CrossLink
          href="/case/nexus"
          title="The Case Nexus"
          sub="Same data, force-directed graph view. Co-defendant clusters."
        />
        <CrossLink
          href="/case/the-salvaged-doj-record"
          title="The salvaged DOJ record"
          sub="The original 1,092 defendants the DOJ scrubbed, preserved."
        />
        <CrossLink
          href="/the-map-room"
          title="The Map Room"
          sub="Live radar of every visitor reading the case right now."
        />
      </section>
    </article>
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
