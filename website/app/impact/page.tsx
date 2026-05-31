import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getOgImage } from "@/lib/og-images";
import { FundingGoalMeter } from "@/components/FundingGoalMeter";
import { SupportersWall } from "@/components/SupportersWall";
import { getFundingData, usd } from "@/lib/funding";
import { getCaseTotals } from "@/lib/case";
import { getPublishedSupporters } from "@/lib/supporters";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

export const revalidate = 300;

const TITLE = "Impact — where the support goes, and what it built";
const DESCRIPTION =
  "Full transparency: the live monthly funding goal, every dollar's mission, and the public record your support has already built — profiles, documents, investigations, video. No ads. No middleman.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/impact");
  const url = `${SITE.url}/impact`;
  const ogImageUrl = override?.image_url ?? null;
  return {
    title: override?.title ?? "Impact",
    description: override?.description ?? DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      url,
      images: ogImageUrl
        ? [{ url: ogImageUrl, width: override?.width ?? 1200, height: override?.height ?? 630, alt: TITLE }]
        : undefined,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

async function getImpactCounts() {
  const supabase = getSupabaseStaticClient();
  const [posts, videos, profiles] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published").eq("type", "video"),
    supabase.from("case_people").select("id", { count: "exact", head: true }).eq("visibility", "public"),
  ]);
  return {
    posts: posts.count ?? 0,
    videos: videos.count ?? 0,
    profiles: profiles.count ?? 0,
  };
}

const MISSIONS: { label: string; blurb: string }[] = [
  { label: "Keep the site alive", blurb: "Hosting, tools, archives, and the independent feed — running on his own land." },
  { label: "Own the video archive", blurb: "Storage, streaming, transcripts, and clips no platform can throttle or pull." },
  { label: "Crimes against children", blurb: "Records work, document review, timelines, and public pressure." },
  { label: "Corrupt officials", blurb: "Public-records work, agency tracking, and accountability files." },
  { label: "Help the community", blurb: "Excess support rolls to someone local who needs real help — documented." },
];

export default async function ImpactPage() {
  const [funding, totals, supporters, counts] = await Promise.all([
    getFundingData(),
    getCaseTotals(),
    getPublishedSupporters(),
    getImpactCounts(),
  ]);

  const ledger: { n: string; label: string; sub: string }[] = [
    { n: counts.profiles.toLocaleString(), label: "J6 defendant profiles", sub: "Free, theirs forever" },
    { n: "1,092", label: "DOJ defendants mirrored", sub: "Salvaged from the scrubbed Capitol Breach list" },
    { n: totals.documents.toLocaleString(), label: "Case documents preserved", sub: "Evidence kept in public" },
    { n: totals.ryanFiledGrievances.toLocaleString(), label: "Grievances Ryan filed", sub: "Documented from inside detention" },
    { n: String(totals.events), label: "Case events mapped", sub: "The timeline, sourced" },
    { n: counts.posts.toLocaleString(), label: "Investigations published", sub: "Reports + dispatches" },
    { n: String(totals.facilities), label: "Facilities documented", sub: "Where he was held" },
    { n: String(counts.videos), label: "Videos owned here", sub: "Not on anyone else's platform" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* ---- Hero ---- */}
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        Impact · full transparency
      </p>
      <h1 className="mt-2 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] font-display">
        Where the support goes — and what it built.
      </h1>
      <p className="mt-4 max-w-2xl text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
        No ads. No middleman. No organization taking a cut. Every dollar goes
        straight to Ryan and gets put to work in the open. Here&apos;s the live
        goal, the missions it funds, and the public record it has already built.
      </p>

      {/* ---- Live funding goal ---- */}
      {funding ? (
        <div className="mt-8">
          <FundingGoalMeter data={funding} />
          <p className="mt-3 text-xs text-[var(--color-muted)] leading-relaxed">
            The meter counts <strong>donations only</strong> — not store orders,
            memberships, or paid builds. Donations are personal gifts, not
            tax-deductible.{" "}
            <Link href="/about/numbers" className="text-[var(--color-accent)] underline underline-offset-4">
              See exactly how every number is counted →
            </Link>
          </p>
        </div>
      ) : null}

      {/* ---- The impact ledger ---- */}
      <section className="mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
          What your support has already built
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Live numbers, straight from the record — not estimates.
        </p>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ledger.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4"
            >
              <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-none text-[var(--color-accent)] font-display tabular-nums">
                {s.n}
              </div>
              <div className="mt-2 text-sm font-bold text-[var(--color-ink)] leading-tight">{s.label}</div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Missions ---- */}
      <section className="mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
          What you can put your dollars on
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Pick a mission when you give. The give-back rule below keeps it honest.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {MISSIONS.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5"
            >
              <p className="text-base font-bold tracking-tight font-display text-[var(--color-ink)]">
                {m.label}
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-snug">{m.blurb}</p>
            </div>
          ))}
        </div>

        {/* Give-back rule */}
        <div className="mt-4 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-blue)] font-bold">
            The give-back rule
          </p>
          <p className="mt-1 text-base font-semibold text-[var(--color-ink)] leading-snug">
            When a goal is met, extra support rolls to the next mission — or to
            someone in the community who needs real help, documented here.
          </p>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="mt-12 rounded-3xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] p-6 sm:p-9 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
          {funding ? `${usd(funding.remainingCents)} to this month's goal.` : "Fuel the mission."}
        </h2>
        <p className="mt-2 text-[var(--color-ink-soft)] max-w-xl mx-auto">
          If the work matters to you, the most direct thing you can do is fund it.
          Every dollar is documented right here.
        </p>
        <Link
          href="/support"
          className="mt-5 inline-block rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-7 py-3 text-base font-bold hover:bg-[var(--color-accent-strong)] transition"
        >
          Fuel the mission →
        </Link>
      </section>

      {/* ---- Supporter wall ---- */}
      <SupportersWall supporters={supporters} />
    </main>
  );
}
