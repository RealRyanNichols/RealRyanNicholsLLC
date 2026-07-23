import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getPeople,
  getPersonBySlug,
  getDocumentsForPerson,
  getCaseTotals,
} from "@/lib/case";
import { getPublishedPosts } from "@/lib/posts";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ShareButton } from "@/components/ShareButton";
import { CaseStats } from "@/components/CaseStats";
import { CaseViewTracker } from "@/components/CaseViewTracker";
import { EvidenceGrid } from "@/components/EvidenceGrid";
import { ClaimMeHero, ClaimMeFooter } from "@/components/ClaimMeHero";
import { CaseInfoCard } from "@/components/CaseInfoCard";
import { ReactionBar } from "@/components/ReactionBar";
import { RyanCaseProfile } from "@/components/RyanCaseProfile";
import { OfficialDossier } from "@/components/OfficialDossier";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, websiteRef } from "@/lib/jsonld";
import { SUBJECT_SLUG } from "@/lib/bio";
import { officialFor } from "@/lib/officials";
import { SITE } from "@/lib/site";

export const revalidate = 300;

function plainText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_~`>#|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function metadataDescription(
  value: string | null | undefined,
  fallback: string,
  maxLength = 160,
): string {
  const cleaned = plainText(value || fallback);
  if (cleaned.length <= maxLength) return cleaned;

  const candidate = cleaned.slice(0, maxLength - 1);
  const naturalBreak = candidate.replace(/\s+\S*$/, "").trim();
  return `${naturalBreak || candidate.trim()}…`;
}

function profileLabel(name: string, isJ6Defendant: boolean, role?: string | null): string {
  return isJ6Defendant
    ? `${name} — January 6 case profile`
    : `${name} — ${role ?? "person of record"}`;
}

export async function generateStaticParams() {
  const list = await getPeople();
  return list.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPersonBySlug(slug);
  if (!p) return { title: "Not found" };

  const url = `${SITE.url}/case/people/${p.slug}`;
  const isJ6Profile = p.is_j6_defendant === true;
  const title = isJ6Profile
    ? `${p.name} | January 6 Case Profile`
    : `${p.name} | ${p.role ?? "Person of Record"}`;
  const fallbackDescription = isJ6Profile
    ? `${p.name}'s January 6 case profile with sourced court records, timeline events, clemency status, related people, and archive connections.`
    : `${p.name}'s sourced profile in the Real Ryan Nichols public case archive.`;
  const description = metadataDescription(p.description, fallbackDescription);
  const ogUrl = `${SITE.url}/og/person/${p.slug}`;
  const imageAlt = isJ6Profile
    ? `${p.name} January 6 case profile social preview`
    : `${p.name} public case-record profile social preview`;
  const ogImages = [
    { url: ogUrl, width: 1200, height: 630, alt: imageAlt },
  ];

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPersonBySlug(slug);
  if (!p) notFound();
  const url = `${SITE.url}/case/people/${p.slug}`;
  const isJ6Profile = p.is_j6_defendant === true;
  const profileName = profileLabel(p.name, isJ6Profile, p.role);
  const profileDescription = metadataDescription(
    p.description,
    isJ6Profile
      ? `${p.name}'s January 6 case profile with sourced court records, timeline events, clemency status, related people, and archive connections.`
      : `${p.name}'s sourced profile in the Real Ryan Nichols public case archive.`,
  );

  // The subject of the entire site gets a bespoke flagship profile instead of
  // the generic person template.
  if (p.slug === SUBJECT_SLUG) {
    const [evidence, totals, posts] = await Promise.all([
      getDocumentsForPerson(p.id),
      getCaseTotals(),
      getPublishedPosts(),
    ]);
    return (
      <RyanCaseProfile person={p} evidence={evidence} totals={totals} posts={posts} url={url} />
    );
  }

  // Public officials of record get a full dossier — the "Wall of Shame" record,
  // documented in their official capacity and labeled claim-by-claim. Overrides
  // the generic person template.
  const dossier = officialFor(p.slug);
  if (dossier) {
    const officialLd = [
      {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "@id": `${url}#profile`,
        url,
        name: `${p.name} — official record profile`,
        isPartOf: websiteRef(),
        mainEntity: {
          "@type": "Person",
          name: p.name,
          url,
          ...(p.role ? { jobTitle: p.role } : {}),
          ...(p.agency
            ? { worksFor: { "@type": "Organization", name: p.agency } }
            : {}),
          description: dossier.standfirst,
        },
      },
      breadcrumbLd([
        { name: "The J6 Case", url: `${SITE.url}/case` },
        { name: "People", url: `${SITE.url}/case?view=people` },
        { name: p.name, url },
      ]),
    ];
    return (
      <>
        <CaseViewTracker type="person" slug={p.slug} />
        <JsonLd data={officialLd} />
        <OfficialDossier dossier={dossier} person={p} url={url} />
      </>
    );
  }

  // Generic people of record get a lightweight ProfilePage + breadcrumb
  // trail. (Ryan's flagship profile carries its own richer schema inside
  // RyanCaseProfile.)
  const personLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": `${url}#profile`,
      url,
      name: profileName,
      isPartOf: websiteRef(),
      mainEntity: {
        "@type": "Person",
        name: p.name,
        url,
        ...(p.role ? { jobTitle: p.role } : {}),
        description: profileDescription,
      },
    },
    breadcrumbLd([
      { name: "The J6 Case", url: `${SITE.url}/case` },
      { name: "People", url: `${SITE.url}/case?view=people` },
      { name: p.name, url },
    ]),
  ];

  const isUnclaimedJ6er =
    p.is_j6_defendant === true &&
    (p.claim_status === "unclaimed" || p.claim_status === "pending");

  if (isUnclaimedJ6er) {
    const supabase = await getSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const signedIn = !!auth.user;

    return (
      <article className="mx-auto max-w-3xl px-4 py-10">
        <CaseViewTracker type="person" slug={p.slug} />
        <JsonLd data={personLd} />

        <nav className="text-sm text-[var(--color-muted)] mb-4">
          <Link href="/case" className="hover:underline">
            ← J6 Case
          </Link>{" "}
          ·{" "}
          <Link href="/j6" className="hover:underline">
            The mission
          </Link>
        </nav>

        <ClaimMeHero
          name={p.name}
          slug={p.slug}
          signedIn={signedIn}
          views={p.views_count}
          shares={p.shares_count}
        />

        <div className="mt-6 flex items-center gap-3">
          <ShareButton
            url={url}
            title={profileName}
            slug={p.slug}
            caseKind="person"
          />
        </div>

        <div className="mt-6">
          <ReactionBar
            targetType="person"
            targetId={p.slug}
            prompt={`Stand with ${p.name} — tap to react, no signup`}
          />
        </div>

        {/* The record this profile already holds — researched, sourced, and
            waiting for its owner. This is what makes the page worth finding,
            sharing, and claiming. */}
        {p.description ? (
          <section className="mt-10">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
              The record, so far
            </p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg">
              {p.description}
            </p>
          </section>
        ) : null}

        <CaseInfoCard person={p} />

        <ClaimMeFooter name={p.name} />
      </article>
    );
  }

  const evidence = await getDocumentsForPerson(p.id);
  const photoAlt = isJ6Profile
    ? `${p.name}, shown for the January 6 case profile and source archive`
    : `${p.name}, shown for the public case-record profile`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <CaseViewTracker type="person" slug={p.slug} />
      <JsonLd data={personLd} />

      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/case" className="hover:underline">
          ← J6 Case
        </Link>{" "}
        ·{" "}
        <Link href="/case?view=people" className="hover:underline">
          All people
        </Link>
      </nav>

      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        {p.is_j6_defendant && p.claim_status === "verified"
          ? "Verified J6 defendant"
          : "Person of record"}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        {p.name}
      </h1>
      {p.role ? (
        <p className="mt-1 text-base font-medium text-[var(--color-accent)]">
          {p.role}
          {p.agency ? ` · ${p.agency}` : ""}
        </p>
      ) : null}

      {p.photo_url ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.photo_url}
            alt={photoAlt}
            className="w-full max-h-[460px] object-cover"
          />
        </div>
      ) : null}

      {p.description ? (
        <p className="mt-6 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap">
          {p.description}
        </p>
      ) : null}

      <CaseInfoCard person={p} />

      <div className="mt-8 flex items-center gap-3">
        <ShareButton url={url} title={profileName} slug={p.slug} caseKind="person" />
      </div>

      <div className="mt-4">
        <CaseStats views={p.views_count} shares={p.shares_count} />
      </div>

      <div className="mt-6">
        <ReactionBar targetType="person" targetId={p.slug} />
      </div>

      {/* The nexus: how this person connects to the anchor case. Detainees,
          co-defendants, and witnesses joined by shared documents. */}
      {p.is_j6_defendant || /detainee|co-?defendant|witness/i.test(p.role ?? "") ? (
        <section className="mt-10 rounded-2xl border-2 border-[var(--color-navy)]/25 bg-[var(--color-blue-soft)]/40 p-5">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-navy)]">
            Connection to United States v. Nichols
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {p.name} appears in the record of United States v. Nichols
            {evidence.length > 0
              ? ` through ${evidence.length} shared ${evidence.length === 1 ? "document" : "documents"} on file below`
              : ""}
            . The full case — timeline, people, documents — is public and free.
          </p>
          <Link
            href="/case"
            className="mt-3 inline-block text-sm font-bold text-[var(--color-navy)] hover:underline"
          >
            Walk the whole case →
          </Link>
        </section>
      ) : null}

      <section className="mt-12 border-t border-[var(--color-line)] pt-8">
        <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
            Evidence on file
          </p>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {evidence.length === 0
              ? "No scans linked yet"
              : `${evidence.length} ${evidence.length === 1 ? "document" : "documents"} on file`}
          </h2>
        </div>
        <EvidenceGrid documents={evidence} />
      </section>

    </article>
  );
}
