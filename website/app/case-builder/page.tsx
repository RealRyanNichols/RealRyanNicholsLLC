import type { Metadata } from "next";
import Link from "next/link";
import { CaseBuildRequestForm } from "@/components/CaseBuildRequestForm";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, orgRef, personRef } from "@/lib/jsonld";
import { SITE } from "@/lib/site";

const TITLE = "Case Builder — get your case documented like United States v. Nichols";
const DESCRIPTION =
  "Ryan Nichols turns a lived case into a public, checkable archive: classified evidence, a dated timeline, people pages, document scans, and search-engine visibility. Request a build — J6 defendants free, forever.";

export const metadata: Metadata = {
  title: "Case Builder",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/case-builder` },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE.url}/case-builder`,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const DELIVERABLES = [
  {
    title: "Evidence, classified",
    detail:
      "Every document scanned, labeled FACT / STATEMENT / NEEDS AUTHENTICATION, and given a permanent page people can cite.",
  },
  {
    title: "A dated timeline",
    detail:
      "Arrest to outcome, day by day, each beat linked to the paper that proves it.",
  },
  {
    title: "People of record",
    detail:
      "Profiles for everyone the record names — witnesses, officials, co-defendants — connected by shared documents.",
  },
  {
    title: "Court records at the source",
    detail:
      "Official filings linked to the public docket so readers verify against the court itself, not a screenshot.",
  },
  {
    title: "Built to be found",
    detail:
      "Search-engine and AI-assistant visibility baked in: structured data, sitemaps, share cards, citation formats.",
  },
  {
    title: "Statement intake",
    detail:
      "A public ledger where witnesses add sworn statements and the record keeps growing after launch.",
  },
];

export default function CaseBuilderPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${SITE.url}/case-builder#service`,
            name: "Case Builder",
            serviceType: "Public case archive & documentation",
            description: DESCRIPTION,
            provider: orgRef(),
            url: `${SITE.url}/case-builder`,
          },
          breadcrumbLd([
            { name: "Work With Me", url: `${SITE.url}/services` },
            { name: "Case Builder", url: `${SITE.url}/case-builder` },
          ]),
        ]}
      />

      <nav className="mb-4 text-sm text-[var(--color-muted)]">
        <Link href="/services" className="hover:underline">
          ← Work with Ryan
        </Link>{" "}
        ·{" "}
        <Link href="/case" className="hover:underline">
          The live example
        </Link>
      </nav>

      <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--color-navy)]">
        Case Builder · by Ryan Nichols
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02]">
        Your case, documented so the world can check it.
      </h1>
      <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-ink-soft)]">
        Ryan built the archive for his own federal case —{" "}
        <Link href="/case" className="font-semibold text-[var(--color-navy)] underline underline-offset-4">
          United States v. Nichols
        </Link>{" "}
        — from inside a jail cell: over a thousand public documents, a dated
        timeline, the people, the grievances, the court record linked at its
        source. He does the same work for others. If you&apos;re fighting a
        case the public should be able to study, this is how it gets a
        permanent, checkable home.
      </p>

      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display">
          What a case build includes
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DELIVERABLES.map((d) => (
            <div
              key={d.title}
              className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4"
            >
              <p className="text-sm font-bold text-[var(--color-ink)]">{d.title}</p>
              <p className="mt-1 text-sm leading-snug text-[var(--color-ink-soft)]">
                {d.detail}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
          Scoped and priced per case — every record set is different. Ryan
          replies to every request personally.{" "}
          <strong className="text-[var(--color-ink)]">
            January 6 defendants: your case profile is free, forever —{" "}
            <Link href="/j6" className="text-[var(--color-navy)] underline underline-offset-2">
              claim it here
            </Link>
            .
          </strong>
        </p>
      </section>

      <section className="mt-10 rounded-2xl border-2 border-[var(--color-navy)]/30 bg-[var(--color-surface)] p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display">
          Request a case build
        </h2>
        <p className="mt-1 mb-5 text-sm text-[var(--color-ink-soft)]">
          Tell it straight. Ryan reads every one.
        </p>
        <CaseBuildRequestForm />
      </section>
    </article>
  );
}
