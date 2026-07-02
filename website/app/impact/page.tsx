import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getOgImage } from "@/lib/og-images";
import { BookCtaBand } from "@/components/BookCtaBand";
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
        Impact · the record
      </p>
      <h1 className="mt-2 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] font-display">
        What the work built.
      </h1>
      <p className="mt-4 max-w-2xl text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
        No ads. No middleman. No organization taking a cut. This is the public
        record built here, on a domain Ryan owns — and it&apos;s paid for by
        what he sells, not by passing the hat.
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

      {/* ---- What keeps it running ---- */}
      <section className="mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
          What keeps it running
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-soft)] leading-relaxed">
          Everything above is funded by work, not gifts: the book, paid builds
          and investigations, and the store. If you want more of this to exist,
          buy the thing that&apos;s worth it to you.
        </p>
        <div className="mt-5">
          <BookCtaBand />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <Link href="/services" className="font-bold text-[var(--color-accent)] hover:underline">
            Hire Ryan — sites, dashboards, investigations →
          </Link>
          <Link href="/store" className="font-bold text-[var(--color-accent)] hover:underline">
            Browse the store →
          </Link>
        </div>
      </section>
    </main>
  );
}
