import type { Metadata } from "next";
import Link from "next/link";
import { getPeople } from "@/lib/case";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Wall of Corroborators",
  description:
    "Every fellow January 6 detainee, federal officer, and witness who has gone on the record corroborating Ryan Nichols' account of the broken DC DOC grievance process and the conditions imposed on January 6 defendants.",
  openGraph: {
    type: "article",
    title: "Wall of Corroborators — United States v. Nichols",
    description:
      "Every fellow January 6 detainee, federal officer, and witness who corroborates Ryan Nichols' account.",
    url: `${SITE.url}/case/witnesses`,
  },
  alternates: { canonical: `${SITE.url}/case/witnesses` },
};

// Mirror the getCaseTotals filter exactly so the hero count and the wall count
// always match.
const FACILITY_STAFF_EXCLUSIONS = new Set([
  "cpl-o-connor",
  "supt-ted-hull",
]);

function isCorroborator(p: { role: string | null; agency: string | null; slug: string }) {
  if (FACILITY_STAFF_EXCLUSIONS.has(p.slug)) return false;
  const haystack = `${p.role ?? ""} ${p.agency ?? ""}`.toLowerCase();
  return (
    /detainee/.test(haystack) ||
    /co-defendant/.test(haystack) ||
    /witness/.test(haystack) ||
    /c-2b/.test(haystack)
  );
}

const FEDERAL_OFFICER_PATTERNS = [
  /marshals service/i,
];

export default async function WitnessesPage() {
  const all = await getPeople();
  const corroborators = all.filter(isCorroborator);
  const federalAcknowledgments = all.filter(
    (p) =>
      FEDERAL_OFFICER_PATTERNS.some((re) => p.agency && re.test(p.agency)) ||
      p.slug === "chief-anderton",
  );

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/case" className="hover:underline">
          ← The Case
        </Link>
      </nav>
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Wall of Corroborators
      </p>
      <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
        He is not alone.
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] max-w-3xl leading-relaxed">
        Every name on this page is someone who went on the record about the same broken system Ryan
        Nichols documents. Fellow January 6 detainees signed witness statements. Federal officers
        and a DC DOC Chief acknowledged the grievance process is broken. The pattern is not one
        man&apos;s story — it is the documented experience of a population.
      </p>

      {federalAcknowledgments.length > 0 ? (
        <section className="mt-12">
          <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
              Federal acknowledgment
            </p>
            <h2 className="text-xl font-bold tracking-tight">
              The IGP is broken — on the record
            </h2>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-2xl">
              Federal officers and DC DOC leadership who have acknowledged the grievance process is
              broken in writing or notarized statements.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {federalAcknowledgments.map((p) => (
              <Link
                key={p.id}
                href={`/case/people/${p.slug}`}
                className="block rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 hover:border-[var(--color-accent)] transition"
              >
                <h3 className="text-lg font-bold tracking-tight">{p.name}</h3>
                <p className="text-sm text-[var(--color-accent)] font-medium mt-0.5">
                  {p.role}
                  {p.agency ? ` · ${p.agency}` : ""}
                </p>
                {p.description ? (
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                    {p.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
            {corroborators.length} fellow January 6 detainees
          </p>
          <h2 className="text-xl font-bold tracking-tight">
            Co-defendants and pod-mates who went on the record
          </h2>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-2xl">
            Each signed at least one statement, letter, or affidavit documenting conditions and
            misconduct that match what Ryan filed.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {corroborators.map((p) => (
            <Link
              key={p.id}
              href={`/case/people/${p.slug}`}
              className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition"
            >
              <h3 className="text-base font-bold tracking-tight">{p.name}</h3>
              <p className="text-xs text-[var(--color-accent)] font-medium mt-0.5">
                {p.role}
              </p>
              {p.description ? (
                <p className="mt-1.5 text-xs text-[var(--color-ink-soft)] leading-relaxed line-clamp-4">
                  {p.description}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-12 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-ink-soft)]">
        <Link href="/support" className="text-[var(--color-accent)] underline font-semibold">
          Support Ryan&apos;s rebuild
        </Link>{" "}
        — every dollar funds keeping this record public.
      </div>
    </article>
  );
}
