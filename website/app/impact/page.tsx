import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getOgImage } from "@/lib/og-images";
import { BookCtaBand } from "@/components/BookCtaBand";
import { FuelBand } from "@/components/FuelBand";
import { getCaseTotals } from "@/lib/case";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

export const revalidate = 300;

// Donations are retired. This page keeps the impact ledger — the public
// record the work has built — and points forward to what's for sale.
const TITLE = "Impact — what the work built";
const DESCRIPTION =
  "The public record this work has already built — profiles, documents, investigations, video. No ads. No middleman. Built here, owned here.";

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

export default async function ImpactPage() {
  const [totals, counts] = await Promise.all([getCaseTotals(), getImpactCounts()]);

  const ledger: { n: string; raw: number; label: string; sub: string }[] = [
    { n: counts.profiles.toLocaleString(), raw: counts.profiles, label: "J6 defendant profiles", sub: "Free, theirs forever" },
    { n: "1,092", raw: 1092, label: "DOJ defendants mirrored", sub: "Salvaged from the scrubbed Capitol Breach list" },
    { n: totals.documents.toLocaleString(), raw: totals.documents, label: "Case documents preserved", sub: "Evidence kept in public" },
    { n: totals.ryanFiledGrievances.toLocaleString(), raw: totals.ryanFiledGrievances, label: "Grievances Ryan filed", sub: "Documented from inside detention" },
    { n: String(totals.events), raw: totals.events, label: "Case events mapped", sub: "The timeline, sourced" },
    { n: counts.posts.toLocaleString(), raw: counts.posts, label: "Investigations published", sub: "Reports + dispatches" },
    { n: String(totals.facilities), raw: totals.facilities, label: "Facilities documented", sub: "Where he was held" },
    { n: String(counts.videos), raw: counts.videos, label: "Videos owned here", sub: "Not on anyone else's platform" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* ---- Hero ---- */}
      <p className="eyebrow">
        Impact · the record
      </p>
      <h1 className="mt-2 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] font-display">
        What the work built.
      </h1>
      <p className="mt-4 max-w-2xl text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
        No ads. No middleman. No organization taking a cut. This is the public
        record built here, on a domain Ryan owns. It runs on AI tokens he pays
        for by the token, the bill is published, and you can fuel it.
      </p>

      {/* ---- The impact ledger ---- */}
      <section className="mt-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
          The ledger
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Live numbers, straight from the record — not estimates.
        </p>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ledger.map((s, i) => (
            <div
              key={s.label}
              className="panel p-4"
              data-reveal
              style={{ "--d": i % 4 } as React.CSSProperties}
            >
              <div
                className="display text-4xl sm:text-5xl leading-none text-[var(--color-gold)] tabular-nums"
                data-count={s.raw}
              >
                {s.n}
              </div>
              <div className="mt-2 text-sm font-bold text-[var(--color-ink)] leading-tight">{s.label}</div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- What keeps it running ---- */}
      <section className="mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
          What keeps it running
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-soft)] leading-relaxed">
          Everything above is funded by work: the book, paid builds and
          investigations, the store, and the Token Fund, where you buy the AI
          fuel and get work back. If you want more of this to exist, buy the
          thing that&apos;s worth it to you.
        </p>
        <div className="mt-5">
          <FuelBand />
        </div>
        <div className="mt-4">
          <BookCtaBand />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <Link href="/services" className="inline-flex min-h-11 items-center font-bold text-[var(--color-accent)] hover:underline sm:min-h-0">
            Hire Ryan — sites, dashboards, investigations →
          </Link>
          <Link href="/store" className="inline-flex min-h-11 items-center font-bold text-[var(--color-accent)] hover:underline sm:min-h-0">
            Browse the store →
          </Link>
        </div>
      </section>
    </main>
  );
}
