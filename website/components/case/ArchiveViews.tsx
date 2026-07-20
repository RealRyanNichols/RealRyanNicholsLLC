import Link from "next/link";
import { format } from "date-fns";
import type { getGrievances, getEvents, getDocuments } from "@/lib/case";

// The three archive views + the severity meter they share.
//
// These used to live at the bottom of app/case/page.tsx alongside a dozen other
// components. Pulled out so each rendering job has a name and a file you can
// find, instead of one 1,448-line page where a change lands in a branch nobody
// reaches. SeverityDots stays with GrievancesView because that is its only
// caller.

function SeverityDots({ severity }: { severity: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Severity ${severity} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={[
            "h-1.5 w-1.5 rounded-full",
            i <= severity
              ? "bg-[var(--color-accent)]"
              : "bg-[var(--color-line)]",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

const NARRATIVE_ACTS: { range: [number, number]; label: string; tag: string; lead: string }[] = [
  {
    range: [1, 7],
    label: "Act I — Five Pillars of Weaponization",
    tag: "Most severe",
    lead: "Constitutional rights, the grievance system used to silence them, denial of mental-health care, solitary, water cut as punishment, officer violence, and chemical agents deployed inside a sealed pod.",
  },
  {
    range: [8, 12],
    label: "Act II — Sixth Amendment / Defense Crippled",
    tag: "Right to counsel & evidence",
    lead: "Brady evidence withheld. Discovery withheld. Legal mail confiscated. Attorney access denied. The constitutional preconditions for any fair trial — denied. The lead grievance: AUSA Brasher's pre-plea denials of Marcus DiPaola's FBI ties, contradicted by Marcus's own public-record self-admission a year and a half after sentencing.",
  },
  {
    range: [13, 20],
    label: "Act III — Cruel and Unusual Conditions",
    tag: "Day-to-day brutality",
    lead: "Rotten food, foreign objects in trays, denied restroom access, denied hygiene, no air conditioning, recreation time cut, untreated injuries, commissary stolen.",
  },
  {
    range: [21, 23],
    label: "Act IV — Healthcare Denial",
    tag: "Pandemic-era neglect",
    lead: "COVID outbreak in the pod, testing denied, vaccine coerced as condition of court access.",
  },
  {
    range: [24, 28],
    label: "Act V — Discrimination and Family Punishment",
    tag: "Targeted, personal",
    lead: "Racial remarks from staff, a discriminatory email from Major Marr, religious services blocked, video visits and family mail denied.",
  },
  {
    range: [29, 32],
    label: "Act VI — The Pattern Across Facilities",
    tag: "Ten different facilities",
    lead: "Ryan was cycled through ten different facilities — Tyler (E.D. Tex.), Oklahoma transit, NW3 quarantine, DC DOC CTF, Rappahannock Regional Jail, Northern Neck Regional Jail, FDC Houston, Florence, Albany Jail, and post-sentence BOP. The same pattern of denied medical care, denied legal access, denied family contact, and a broken grievance system followed him at every stop. The IGP-broken finding has U.S. Marshals and a DC DOC Chief on the record.",
  },
  {
    range: [33, 34],
    label: "Act VII — The Damage Inflicted",
    tag: "What it cost him",
    lead: "Years of pretrial detention, denied family visits, intercepted mail, transfers without notice — the prosecution did not just deprive Ryan of his liberty. It destroyed his marriage, took him out of his children's daily lives, and ended the multi-million-dollar wholesale/retail company he built from the ground up. This is the harm the Anti-Weaponization Fund exists to remedy.",
  },
];

export function GrievancesView({ grievances }: { grievances: Awaited<ReturnType<typeof getGrievances>> }) {
  const groups = NARRATIVE_ACTS.map((act) => ({
    ...act,
    items: grievances.filter((g) => g.display_order >= act.range[0] && g.display_order <= act.range[1]),
  }));
  return (
    <div className="space-y-10">
      {groups.map((act) =>
        act.items.length === 0 ? null : (
          <section key={act.label}>
            <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
                {act.tag}
              </p>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">{act.label}</h2>
              <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-2xl leading-relaxed">
                {act.lead}
              </p>
            </div>
            <div className="space-y-3">
              {act.items.map((g) => (
                <Link
                  key={g.id}
                  href={`/case/grievances/${g.slug}`}
                  className="block group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <SeverityDots severity={g.severity} />
                        {g.category ? (
                          <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
                            {g.category}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-lg font-bold tracking-tight">
                        <span className="text-[var(--color-accent)] mr-2">#{g.display_order}</span>
                        {g.title}
                      </h3>
                      {g.summary ? (
                        <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                          {g.summary}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold leading-none">{g.count}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mt-1">
                        filings
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}

export function TimelineView({ events }: { events: Awaited<ReturnType<typeof getEvents>> }) {
  return (
    <ol className="space-y-0">
      {events.map((e) => (
        <li key={e.id} className="relative pl-8 pb-8 border-l border-[var(--color-line)] last:border-l-0">
          <span
            className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-paper)]"
            aria-hidden
          />
          <Link href={`/case/events/${e.slug}`} className="group block">
            <time className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
              {e.event_date ? format(new Date(e.event_date), "MMMM d, yyyy") : "Date pending verification"}
            </time>
            <h2 className="mt-1 text-lg font-bold tracking-tight group-hover:text-[var(--color-accent)] transition">
              {e.title}
            </h2>
            {e.description ? (
              <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
                {e.description}
              </p>
            ) : null}
            {e.location ? (
              <p className="mt-1 text-xs text-[var(--color-muted)]">📍 {e.location}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ol>
  );
}

const PEOPLE_GROUPS: { label: string; match: (agency: string | null) => boolean; lead: string }[] = [
  {
    label: "Executive",
    match: (a) => !!a && /^executive/i.test(a),
    lead: "The Presidential pardon and the Anti-Weaponization Fund originate here.",
  },
  {
    label: "Judiciary",
    match: (a) => !!a && /district court/i.test(a),
    lead: "Federal judges who presided over the case and were the subject of defense motions.",
  },
  {
    label: "Prosecution",
    match: (a) => !!a && /u\.?s\.? attorney/i.test(a),
    lead: "Federal prosecutors of record in United States v. Nichols.",
  },
  {
    label: "Defense Counsel",
    match: (a) => !!a && /private counsel/i.test(a),
    lead: "Defense attorneys representing Ryan and other January 6 defendants.",
  },
  {
    label: "Capitol Police / MPD (January 6)",
    match: (a) => !!a && /capitol police|mpd/i.test(a),
    lead: "Officers from the events at the U.S. Capitol on January 6, 2021 — named in the bodycam discovery record.",
  },
  {
    label: "DC DOC / Detention Staff",
    match: (a) => !!a && /(dc doc|doc medical|igp)/i.test(a),
    lead: "Detention staff named in the documented grievances.",
  },
  {
    label: "Rappahannock & Northern Neck",
    match: (a) => !!a && /(rappahannock|northern neck)/i.test(a),
    lead: "Staff at the second and third facilities Ryan was moved through after the unannounced September 2022 transfer.",
  },
  {
    label: "U.S. Marshals",
    match: (a) => !!a && /marshals/i.test(a),
    lead: "Federal officers tied to specific incidents inside the facilities — including the witness statement acknowledging the IGP is broken.",
  },
  {
    label: "Co-defendants & Fellow Detainees",
    match: (a) => !!a && /(c-2b|^dc doc$|harkrider|defend|j6 detainee|sibick witness)/i.test(a),
    lead: "Co-defendants on the indictment and detainees who signed witness statements.",
  },
  {
    label: "January 6 Capitol Crowd",
    match: (a) => !!a && /january 6 capitol crowd/i.test(a),
    lead: "Civilian figures from the Capitol events on January 6.",
  },
  {
    label: "Family",
    match: (a) => !!a && /family/i.test(a),
    lead: "Family members directly affected.",
  },
];

export function DocumentsView({ documents }: { documents: Awaited<ReturnType<typeof getDocuments>> }) {
  // The archive is visual — nearly every record on file is a scan. Show the
  // paper, not a paragraph about the paper. Fixed 4:3 wells keep every card
  // the same shape no matter what the underlying scan measures, so the grid
  // stays square on a phone and on a desktop.
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((d) => (
        <Link
          key={d.id}
          href={`/case/documents/${d.slug}`}
          className="group flex flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] transition hover:border-[var(--color-accent)] hover:shadow-md"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            {/* The plate always renders underneath. If the scan is missing or
                the image request fails, this is what shows — a designed tile,
                never a broken icon or raw alt text bleeding over black. */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#16223f] to-[#0b1428] px-3 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                {d.doc_type}
              </span>
              <span className="text-[9px] leading-snug text-white/40">
                Record on file — open to view
              </span>
            </div>
            {d.file_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/api/case-doc/${d.slug}/image`}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full bg-black object-cover object-top transition duration-300 group-hover:scale-[1.03]"
              />
            ) : null}
            <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-sm">
              {d.doc_type}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-3.5">
            {d.document_date ? (
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                {format(new Date(d.document_date), "MMM d, yyyy")}
              </p>
            ) : null}
            <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-snug tracking-tight text-[var(--color-ink)] transition group-hover:text-[var(--color-navy)]">
              {d.title}
            </h2>
            {d.description ? (
              <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-[var(--color-ink-soft)]">
                {d.description}
              </p>
            ) : null}
            <span className="mt-auto pt-2.5 text-xs font-bold text-[var(--color-navy)]">
              Open the record →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

