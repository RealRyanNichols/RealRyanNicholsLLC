import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { J6Top25Ballot } from "@/components/J6Top25Ballot";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Top 25 Most Publicized January 6 Cases",
  description:
    "Vote for the January 6 case that received the most public attention. One verified-email account gets one active vote, with write-ins allowed.",
  alternates: { canonical: `${SITE.url}/j6/top-25` },
  openGraph: {
    type: "website",
    title: "Top 25 Most Publicized January 6 Cases",
    description:
      "A live community ranking of the January 6 cases that generated the most public attention.",
    url: `${SITE.url}/j6/top-25`,
    images: [{ url: `${SITE.url}/og/case?view=people`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top 25 Most Publicized January 6 Cases",
    description:
      "Vote once per verified-email account. Write-ins can rise into the Top 25.",
    images: [`${SITE.url}/og/case?view=people`],
  },
};

type Candidate = {
  id: string;
  slug: string;
  display_name: string;
  aliases: string[] | null;
  seed_rank: number | null;
  is_seeded: boolean;
  case_person_id: string | null;
  editorial_note: string | null;
  vote_count: number;
  profile_slug: string | null;
  photo_url: string | null;
  role: string | null;
};

export default async function J6Top25Page() {
  const supabase = await getSupabaseServerClient();
  const [{ data: auth }, { data: candidateRows, error: candidateError }, { data: voteRows }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("j6_top25_candidates")
        .select(
          "id,slug,display_name,aliases,seed_rank,is_seeded,case_person_id,editorial_note,case_people(slug,photo_url,role)"
        )
        .eq("is_active", true),
      supabase.from("j6_top25_votes").select("candidate_id"),
    ]);

  const user = auth.user;
  const verifiedEmail = Boolean(user?.email && user.email_confirmed_at);
  let activeVoteId: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("j6_top25_votes")
      .select("candidate_id")
      .eq("user_id", user.id)
      .maybeSingle();
    activeVoteId = data?.candidate_id ?? null;
  }

  const counts = new Map<string, number>();
  for (const row of voteRows ?? []) {
    counts.set(row.candidate_id, (counts.get(row.candidate_id) ?? 0) + 1);
  }

  const candidates: Candidate[] = (candidateRows ?? [])
    .map((row: any) => {
      const profile = Array.isArray(row.case_people) ? row.case_people[0] : row.case_people;
      return {
        id: row.id,
        slug: row.slug,
        display_name: row.display_name,
        aliases: row.aliases,
        seed_rank: row.seed_rank,
        is_seeded: row.is_seeded,
        case_person_id: row.case_person_id,
        editorial_note: row.editorial_note,
        vote_count: counts.get(row.id) ?? 0,
        profile_slug: profile?.slug ?? null,
        photo_url: profile?.photo_url ?? null,
        role: profile?.role ?? null,
      };
    })
    .sort((a, b) => {
      if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count;
      if (a.is_seeded !== b.is_seeded) return a.is_seeded ? -1 : 1;
      return (a.seed_rank ?? 9999) - (b.seed_rank ?? 9999);
    });

  const top25 = candidates.slice(0, 25);
  const totalVotes = voteRows?.length ?? 0;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Top 25 Most Publicized January 6 Cases",
    numberOfItems: top25.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: top25.map((candidate, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: candidate.display_name,
      url: candidate.profile_slug
        ? `${SITE.url}/case/people/${candidate.profile_slug}`
        : `${SITE.url}/j6/top-25#${candidate.slug}`,
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <nav className="mb-6 text-sm text-[var(--color-muted)]">
        <Link href="/j6" className="font-semibold hover:underline">← J6 Archive</Link>
        <span className="mx-2">·</span>
        <Link href="/case?view=people" className="font-semibold hover:underline">All profiles</Link>
      </nav>

      <header className="overflow-hidden rounded-3xl border border-[#26385f] bg-[#071329] px-6 py-8 text-[#f8f2df] shadow-2xl sm:px-10 sm:py-12">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">Community ranking · live vote</p>
        <h1 className="mt-3 max-w-4xl font-display text-4xl font-black leading-[0.95] sm:text-6xl">
          Which January 6 case had the most hype?
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#cbd5e7] sm:text-xl">
          This is a ranking of public attention, media coverage, political focus, and name recognition — not guilt, character, or historical importance. Each confirmed-email account gets one active vote. You may change it at any time.
        </p>
        <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full border border-[#44577d] bg-[#101f3d] px-4 py-2">{totalVotes.toLocaleString()} total votes</span>
          <span className="rounded-full border border-[#44577d] bg-[#101f3d] px-4 py-2">One active vote per account</span>
          <span className="rounded-full border border-[#44577d] bg-[#101f3d] px-4 py-2">Write-ins can enter the Top 25</span>
        </div>
      </header>

      {candidateError ? (
        <div className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          The ranking data could not be loaded. Please try again shortly.
        </div>
      ) : (
        <J6Top25Ballot
          initialCandidates={top25}
          signedIn={Boolean(user)}
          verifiedEmail={verifiedEmail}
          activeVoteId={activeVoteId}
        />
      )}

      <section className="mt-12 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-8">
        <h2 className="font-display text-2xl font-black">How replacement works</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-[var(--color-ink-soft)]">
          The original list starts with 25 seeded names. A valid write-in becomes a candidate and receives the nominating account’s vote. When a write-in earns enough votes to move above a current member, the live ranking changes automatically. The underlying archive profile remains intact even when a person moves in or out of this public-attention ranking.
        </p>
      </section>
    </main>
  );
}
