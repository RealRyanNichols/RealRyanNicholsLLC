import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import {
  getGrievances,
  getPeople,
  getEvents,
  getDocuments,
  getCaseTotals,
} from "@/lib/case";
import { ShareButton } from "@/components/ShareButton";
import { PrintButton } from "@/components/PrintButton";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Compensation Brief · United States v. Nichols",
  description:
    "Curated overview of Ryan Nichols' January 6 case — grievances, named officials, key events, and supporting documents. Prepared for compensation review.",
  openGraph: {
    type: "article",
    title: "Compensation Brief — United States v. Nichols",
    description:
      "Curated overview prepared for compensation review under the DOJ Anti-Weaponization Fund.",
    url: `${SITE.url}/case/brief`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Compensation Brief — United States v. Nichols",
  },
  alternates: { canonical: `${SITE.url}/case/brief` },
};

export default async function BriefPage() {
  const [grievances, people, events, documents, totals] = await Promise.all([
    getGrievances(),
    getPeople(),
    getEvents(),
    getDocuments(),
    getCaseTotals(),
  ]);

  // Sort grievances by severity desc, then display order
  const ranked = [...grievances].sort(
    (a, b) =>
      (b.severity ?? 0) - (a.severity ?? 0) ||
      (a.display_order ?? 999) - (b.display_order ?? 999)
  );
  const topGrievances = ranked.filter((g) => g.severity >= 4);
  const otherGrievances = ranked.filter((g) => g.severity < 4);

  // Sort events chronologically — events without a confirmed date sort to the top
  const timeline = [...events].sort((a, b) => {
    if (!a.event_date && !b.event_date) return a.title.localeCompare(b.title);
    if (!a.event_date) return -1;
    if (!b.event_date) return 1;
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
  });

  // Sort documents by date desc
  const docs = [...documents].sort((a, b) => {
    if (!a.document_date) return 1;
    if (!b.document_date) return -1;
    return new Date(b.document_date).getTime() - new Date(a.document_date).getTime();
  });
  const keyDocs = docs.filter((d) =>
    ["indictment", "docket", "motion", "ruling", "order", "transcript", "affidavit"].includes(d.doc_type)
  );

  const ryanFiledGrievances = totals.ryanFiledGrievances;

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 print:py-4 print:px-0">
      {/* Header */}
      <header className="border-b border-[var(--color-line)] pb-6 print:border-black">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold print:text-black">
              Compensation Brief
            </p>
            <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              United States v. Nichols
            </h1>
            <p className="mt-3 text-base text-[var(--color-ink-soft)] max-w-2xl leading-relaxed print:text-black">
              Ryan Nichols — US Marine Corps Veteran, Founder of Wholesale
              Universe, Inc. (a multi-million-dollar wholesale/retail company),
              Search and Rescue Specialist, Jan 6th Pardoned Defendant. The
              only January 6th defendant whose judge admitted, multiple times
              on the record, that his due process rights were violated.
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <PrintButton />
            <ShareButton
              url={`${SITE.url}/case/brief`}
              title="Compensation Brief — United States v. Nichols"
            />
          </div>
        </div>
      </header>

      {/* Top-line numbers */}
      <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
        <Stat label="Grievance categories" value={String(grievances.length)} sub={`${ryanFiledGrievances} forms Ryan personally filed`} />
        <Stat label="Officials named" value={String(people.length)} sub="across agencies" />
        <Stat label="Timeline events" value={String(events.length)} sub="2021 – 2026" />
        <Stat label="Documents in the record" value={String(documents.length)} sub="incl. corroborating" />
      </section>

      {/* Executive summary */}
      <section className="mt-10 prose-body">
        <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-ink)] mb-3 print:text-black">
          Executive summary
        </h2>
        <p>
          Ryan Nichols, a United States Marine Corps veteran, founder of
          Wholesale Universe, Inc. (a multi-million-dollar wholesale/retail
          company), and active Search and Rescue specialist, was prosecuted,
          detained pretrial, and
          tortured by a weaponized Biden-era Department of Justice for his
          conduct on January 6, 2021. He was pardoned by President Trump in
          January 2025.
        </p>
        <p>
          During pretrial detention, Mr. Nichols personally filed{" "}
          <strong>{ryanFiledGrievances} formal Inmate Grievance Procedure forms</strong>{" "}
          across <strong>{grievances.length} distinct grievance categories</strong>{" "}
          — documenting the Brady-suppressed Marcus DiPaola / 1% Watchdog
          informant relationship, violations of his Sixth Amendment right to
          counsel and discovery, deprivation of mental health care that
          culminated in a neighboring inmate&apos;s suicide, OC-spray attacks
          on the entire pod, punitive water shut-offs, racial remarks from
          staff, and a systematically broken grievance process. The case
          file also holds corroborating witness statements and IGPs from
          fellow January 6 detainees that Mr. Nichols collected as evidence;
          those are catalogued separately from his own filings.
        </p>
        <p>
          On <strong>August 10, 2022</strong>, attorneys Joseph D. McBride and
          Jonathan S. Gross filed a <strong>65-page Petition for Writ of Habeas
          Corpus under 28 U.S.C. § 2241</strong> on Mr. Nichols&apos; behalf
          (<em>Nichols v. Garland</em>, Civil Action No. 1:22-cv-02356), naming
          Attorney General Merrick Garland and DC Jail CTF Deputy Warden Michelle
          Jones as respondents and asserting five constitutional causes of action
          under the First, Fifth, Sixth, and Eighth Amendments. The petition
          incorporates sworn witness statements from fellow C-2B detainees
          (Jeffrey McKellop, Jessica Watkins, Daniel Caldwell, Timothy
          Hale-Cusanelli, James McGrew) and cites the contempt finding entered
          by Judge Royce C. Lamberth against DC DOC Director Quincy Booth in{" "}
          <em>U.S. v. Worrell</em> on October 13, 2021 for the same conditions.
          Additional external corroboration on the record: the U.S. Marshals
          Service inspection memo of October 20, 2021 (standing sewage, food
          and water withheld); the Congressional &ldquo;Unusually Cruel&rdquo;
          report of December 7, 2021; and the 14-Member Congressional letter
          of January 3, 2022 to BOP Director Carvajal, who resigned weeks later.
        </p>
        <p>
          Documentation includes the original Indictment, the federal Docket
          Summary, the supporting Affidavit, sworn motions for reconsideration
          of detention, the Government&apos;s oppositions, the 2025 Omnibus
          Motion transcript, the full Habeas Corpus petition described above,
          and a Master Grievance Spreadsheet that the United States Marshals
          Office relied on when it determined that the facility&apos;s
          grievance process was broken.
        </p>
        <p>
          This brief is prepared for review under the Justice Department&apos;s{" "}
          <em>Anti-Weaponization Fund</em>. Mr. Nichols seeks compensation for
          the deprivation of rights, the medical and mental-health damages he
          continues to incur, lost earnings, and the long-tail costs of
          rebuilding a life dismantled by federal prosecution.
        </p>
      </section>

      {/* Severity 4-5 grievances */}
      {topGrievances.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl sm:text-3xl mb-1">
            Constitutional & severe grievances ({topGrievances.length})
          </h2>
          <p className="text-sm text-[var(--color-muted)] mb-4 print:text-black">
            Severity 4 or 5 of 5. Each filed and documented during pretrial detention.
          </p>
          <ol className="space-y-3">
            {topGrievances.map((g) => (
              <li
                key={g.id}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 print:break-inside-avoid print:bg-white print:border-black"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[var(--color-accent)] print:text-black">
                    #{g.display_order}
                  </span>
                  <h3 className="font-bold text-base">{g.title}</h3>
                  {g.category ? (
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold print:text-black">
                      {g.category}
                    </span>
                  ) : null}
                  <span className="text-[10px] text-[var(--color-muted)] ml-auto print:text-black">
                    Severity {g.severity}/5 · {g.count} filing{g.count === 1 ? "" : "s"}
                  </span>
                </div>
                {g.summary ? (
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed print:text-black">
                    {g.summary}
                  </p>
                ) : null}
                <p className="mt-2 print:hidden">
                  <Link
                    href={`/case/grievances/${g.slug}`}
                    className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    Open detail page →
                  </Link>
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Lower-severity grievances — condensed */}
      {otherGrievances.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-xl sm:text-2xl mb-1">
            Additional documented grievances ({otherGrievances.length})
          </h2>
          <p className="text-sm text-[var(--color-muted)] mb-3 print:text-black">
            Severity 1–3. Filed contemporaneously with the constitutional grievances above.
          </p>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm print:text-black">
            {otherGrievances.map((g) => (
              <li
                key={g.id}
                className="rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 print:bg-white print:border-black print:break-inside-avoid"
              >
                <span className="font-semibold">{g.title}</span>{" "}
                <span className="text-xs text-[var(--color-muted)] print:text-black">
                  · {g.count}× · severity {g.severity}/5
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* People */}
      <section className="mt-10">
        <h2 className="font-display text-2xl sm:text-3xl mb-1">
          Cast of named officials ({people.length})
        </h2>
        <p className="text-sm text-[var(--color-muted)] mb-4 print:text-black">
          Each individually identified in Mr. Nichols&apos; contemporaneous
          grievance log.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {people.map((p) => (
            <div
              key={p.id}
              className="rounded border border-[var(--color-line)] bg-[var(--color-surface)] p-3 print:bg-white print:border-black print:break-inside-avoid"
            >
              <p className="font-bold text-sm">{p.name}</p>
              <p className="text-xs text-[var(--color-accent)] font-semibold print:text-black">
                {p.role}
                {p.agency ? ` · ${p.agency}` : ""}
              </p>
              {p.description ? (
                <p className="mt-1.5 text-xs text-[var(--color-ink-soft)] leading-relaxed print:text-black">
                  {p.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-10">
        <h2 className="font-display text-2xl sm:text-3xl mb-4">
          Timeline ({timeline.length} events)
        </h2>
        <ol className="space-y-3">
          {timeline.map((e) => (
            <li
              key={e.id}
              className="border-l-2 border-[var(--color-accent)] pl-4 print:border-black print:break-inside-avoid"
            >
              <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold print:text-black">
                {e.event_date ? format(new Date(e.event_date), "MMMM d, yyyy") : "Date pending verification"}
              </p>
              <p className="font-bold mt-1">{e.title}</p>
              {e.description ? (
                <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-relaxed print:text-black">
                  {e.description}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* Key documents */}
      <section className="mt-10">
        <h2 className="font-display text-2xl sm:text-3xl mb-1">
          Key documents in the record ({keyDocs.length} of {documents.length})
        </h2>
        <p className="text-sm text-[var(--color-muted)] mb-4 print:text-black">
          Indictments, dockets, motions, rulings, transcripts, affidavits.
          Personal scans and contemporaneous cell notes are catalogued at{" "}
          <Link href="/case?view=documents" className="text-[var(--color-accent)] underline">
            /case?view=documents
          </Link>
          .
        </p>
        <ol className="space-y-1.5">
          {keyDocs.map((d) => (
            <li
              key={d.id}
              className="flex items-baseline gap-3 text-sm rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 print:bg-white print:border-black print:break-inside-avoid"
            >
              <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-accent)] print:text-black w-20 flex-shrink-0">
                {d.doc_type}
              </span>
              {d.document_date ? (
                <span className="text-xs text-[var(--color-muted)] print:text-black w-24 flex-shrink-0">
                  {format(new Date(d.document_date), "MMM d, yyyy")}
                </span>
              ) : (
                <span className="w-24 flex-shrink-0" />
              )}
              <span className="font-semibold flex-1">{d.title}</span>
              <a
                href={d.file_url ?? d.external_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[var(--color-accent)] hover:underline whitespace-nowrap print:text-black"
              >
                Open
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* Compensation ask */}
      <section className="mt-10 rounded-2xl border-2 border-[var(--color-accent)] p-6 bg-[var(--color-surface)] print:bg-white print:border-black">
        <h2 className="font-display text-2xl sm:text-3xl mb-2">
          Relief sought
        </h2>
        <ul className="prose-body space-y-1 list-disc pl-5 print:text-black">
          <li>
            Compensatory damages for deprivation of constitutional rights under
            the Fourth, Fifth, Sixth, and Eighth Amendments.
          </li>
          <li>
            Reimbursement for the long-tail medical and mental-health costs
            attributable to pretrial conditions of confinement.
          </li>
          <li>
            Lost income and earning capacity for the duration of pretrial
            detention and resulting personal disruption.
          </li>
          <li>
            Costs of rebuilding the dismantled life: housing, transportation,
            equipment, and the platform infrastructure required to keep this
            record public.
          </li>
          <li>
            Any further relief the Anti-Weaponization Fund deems appropriate.
          </li>
        </ul>
      </section>

      <footer className="mt-12 pt-6 border-t border-[var(--color-line)] text-xs text-[var(--color-muted)] print:border-black print:text-black">
        <p>
          Brief generated {format(new Date(), "MMMM d, yyyy 'at' h:mm a")} from
          live data at{" "}
          <Link href="/case" className="underline text-[var(--color-accent)] print:text-black">
            realryannichols.com/case
          </Link>
          . This page updates automatically as new documents are added.
        </p>
      </footer>
    </article>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 print:bg-white print:border-black">
      <div className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mt-0.5 font-semibold print:text-black">
        {label}
      </div>
      {sub ? <div className="text-xs text-[var(--color-ink-soft)] mt-1 print:text-black">{sub}</div> : null}
    </div>
  );
}
