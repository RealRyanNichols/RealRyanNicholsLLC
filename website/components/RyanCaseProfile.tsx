import Link from "next/link";
import type { CasePerson, CaseDocument } from "@/lib/case";
import { ROLE_LINE, DECORATIONS, OPERATIONS, RECOGNITION } from "@/lib/bio";
import { storySlugFor } from "@/lib/story";
import { muxThumbnailUrl } from "@/lib/mux";
import { CaseViewTracker } from "@/components/CaseViewTracker";
import { ShareButton } from "@/components/ShareButton";
import { CaseInfoCard } from "@/components/CaseInfoCard";
import { CaseStats } from "@/components/CaseStats";
import { EvidenceGrid } from "@/components/EvidenceGrid";
import { ReactionBar } from "@/components/ReactionBar";
import { ReadingProgress } from "@/components/ReadingProgress";
import { JsonLd } from "@/components/JsonLd";
import { PERSON_ID, personRef, websiteRef } from "@/lib/jsonld";
import { SITE } from "@/lib/site";
import type { Post } from "@/lib/types";

type CaseTotals = {
  grievances: number;
  ryanFiledGrievances: number;
  documents: number;
  facilities: number;
  corroborators: number;
  daysDetained: number;
  events: number;
};

// How many linked documents render on the profile itself before handing off
// to the documents view.
const EVIDENCE_SAMPLE = 12;

// Every dispatch card carries a picture: the post's own art if it has any,
// the video's first frame, else the generated share card — never a bare box.
function postThumb(p: Post): string {
  return (
    p.thumbnail_url ||
    p.image_urls?.find(Boolean) ||
    p.media?.find(
      (m) => m.url && !/\.(mp4|mov|m4v|webm)(?:\?|#|$)/i.test(m.url),
    )?.url ||
    (p.type === "video" && p.mux_playback_id
      ? muxThumbnailUrl(p.mux_playback_id, { width: 600, time: 1 })
      : `/og/${p.slug}`)
  );
}

// The bespoke, flagship profile for the subject of the entire site. Everything
// else at /case/people/[slug] uses the generic person template; Ryan's own page
// pulls the whole record together — who he was before the case, the case
// itself, the numbers, and what he's fighting for now.
export function RyanCaseProfile({
  person,
  evidence,
  totals,
  posts,
  url,
}: {
  person: CasePerson;
  evidence: CaseDocument[];
  totals: CaseTotals;
  posts: Post[];
  url: string;
}) {
  const titledPosts = posts.filter((p) => p.title && p.title.trim()).slice(0, 6);

  // Structured data: extend the site-wide Person entity (declared in the root
  // layout by @id) with case-specific detail, mark this page as his profile,
  // describe the archive as a Dataset, and answer the questions people
  // actually ask engines — every answer drawn from this page's verified copy.
  const days = totals.daysDetained.toLocaleString("en-US");
  const profileLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": `${url}#profile`,
      url,
      name: `${person.name} — United States v. Nichols`,
      isPartOf: websiteRef(),
      mainEntity: {
        "@type": "Person",
        "@id": PERSON_ID,
        name: person.name,
        alternateName: "Ryan Taylor Nichols",
        description: ROLE_LINE,
        url: SITE.url,
        jobTitle: "Independent investigative journalist",
        sameAs: ["https://x.com/RealRyanNichols"],
        knowsAbout: [
          "United States v. Nichols (1:21-cr-00117, D.D.C.)",
          "January 6 prosecutions",
          "Pretrial detention conditions",
          "Due process",
          "Search and rescue operations",
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${SITE.url}/case#archive`,
      url: `${SITE.url}/case`,
      name: "The J6 Case Archive — United States v. Nichols",
      isPartOf: websiteRef(),
      about: personRef(),
      mainEntity: {
        "@type": "Dataset",
        "@id": `${SITE.url}/case#dataset`,
        name: "The J6 Case Archive — United States v. Nichols",
        description: `The public record of United States v. Nichols (1:21-cr-00117, D.D.C.): ${totals.documents.toLocaleString("en-US")} documents, ${totals.grievances} documented grievance patterns, ${totals.ryanFiledGrievances.toLocaleString("en-US")} grievance forms authored in custody, and the people of record — open, sourced, and free.`,
        creator: personRef(),
        license: `${SITE.url}/case`,
        isAccessibleForFree: true,
        distribution: [
          {
            "@type": "DataDownload",
            contentUrl: `${SITE.url}/case?view=documents`,
            encodingFormat: "text/html",
          },
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Who is Ryan Nichols?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Ryan Taylor Nichols is a pardoned January 6 defendant, U.S. Marine Corps veteran, search-and-rescue specialist, and independent investigative journalist. Before the case he served in the Marine Corps (2010–2014, honorable discharge) and led civilian search-and-rescue work across more than two dozen hurricane deployments.`,
          },
        },
        {
          "@type": "Question",
          name: "Was Ryan Nichols pardoned?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. He was granted a full and unconditional pardon by President Trump on January 20, 2025. Following the pardon, the charges were dismissed with prejudice — the case can never be brought again.",
          },
        },
        {
          "@type": "Question",
          name: "What was United States v. Nichols?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "United States v. Nichols (case 1:21-cr-00117, D.D.C.) was the federal January 6 prosecution of Ryan Nichols. He was arrested January 18, 2021, pleaded guilty in November 2023 to two felonies — obstruction of an official proceeding and assaulting, resisting, or impeding officers — and was sentenced May 2, 2024 to 63 months and a $200,000 fine — the largest fine imposed in any January 6 case. He was fully pardoned January 20, 2025, and the case was dismissed with prejudice.",
          },
        },
        {
          "@type": "Question",
          name: "What happened to Ryan Nichols in jail?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `He was detained ${days} days between arrest and pardon, held across ${totals.facilities} federal and local facilities, including extended solitary confinement. In December 2021 a federal judge acknowledged on the record that his due-process rights had been violated; he remained detained. From inside he authored ${totals.ryanFiledGrievances.toLocaleString("en-US")} grievance forms, and the conditions record — photographs, complaints, medical records — is public in the case archive.`,
          },
        },
        {
          "@type": "Question",
          name: "Did Ryan Nichols sue the government over his detention?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. On August 10, 2022, while still detained, he petitioned for a writ of habeas corpus — Nichols v. Garland, No. 1:22-cv-02356 (D.D.C.) — naming Attorney General Merrick Garland and DC jail leadership. The petition was voluntarily dismissed that October, and on November 22, 2022 the criminal court ordered his release on personal recognizance. Both filings are public in the archive.",
          },
        },
      ],
    },
  ];

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={profileLd} />
      <CaseViewTracker type="person" slug={person.slug} />
      <ReadingProgress />

      <nav className="text-sm text-[var(--color-muted)] mb-2">
        <Link href="/case" className="hover:underline">
          ← J6 Case
        </Link>{" "}
        ·{" "}
        <Link href="/case?view=people" className="hover:underline">
          All people
        </Link>
      </nav>

      <p className="mb-4 text-xs text-[var(--color-muted)]">
        Attorney evaluating his current matter?{" "}
        <a
          href="#attorney-briefing"
          className="font-bold text-[var(--color-navy)] hover:underline"
        >
          Jump to the briefing ↓
        </a>
      </p>

      {/* ---- Hero ---- */}
      <div className="rounded-3xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] p-6 sm:p-9">
        {person.photo_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={person.photo_url}
              alt={person.name}
              className="float-right ml-4 mb-3 h-32 w-32 sm:h-44 sm:w-44 rounded-2xl object-cover border-2 border-[var(--color-accent)] shadow-lg"
            />
          </>
        ) : null}
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-accent)] font-bold">
          Verified subject · United States v. Nichols
        </p>
        <h1 className="mt-2 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] font-display">
          {person.name}
        </h1>
        <p className="mt-3 text-sm sm:text-base font-semibold text-[var(--color-ink)] leading-relaxed">
          {ROLE_LINE}
        </p>
        <p className="mt-4 max-w-2xl border-l-2 border-[var(--color-navy)] pl-4 text-sm font-semibold leading-relaxed text-[var(--color-ink)]">
          Sentenced May 2, 2024. Pardoned in full on January 20, 2025 — and the
          case was dismissed with prejudice. It can never be brought again.
        </p>
        <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-[var(--color-ink)]">
          New here? This page is the whole story, told in paper: a Marine and
          hurricane rescuer, arrested after January 6 — {days} days detained,
          solitary confinement, a judge admitting on the record that his due
          process was violated, a habeas suit filed from his cell, release, a
          plea, 63 months, then a full pardon and dismissal with prejudice.
          Every claim links to the document that proves it. Read it. Check it.
          Share it.
        </p>
      </div>

      {person.description ? (
        <p className="mt-6 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap">
          {person.description}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <ShareButton
          url={url}
          title={`${person.name} — United States v. Nichols. Pardoned, charges dismissed with prejudice. The full record:`}
          slug={person.slug}
          caseKind="person"
        />
      </div>
      <div className="mt-3">
        <ReactionBar
          targetType="person"
          targetId={person.slug}
          prompt="Stand with Ryan — tap to react, no signup."
        />
      </div>

      {/* ---- The case in numbers ---- */}
      {/* Every number is a door to its proof — nothing on this page is a
          claim without a receipt. */}
      <section className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat
          n={String(totals.facilities)}
          label="Facilities held across"
          href="/case/geography"
        />
        <Stat
          n={totals.daysDetained.toLocaleString()}
          label="Days, arrest → pardon"
          href="/case?view=timeline"
        />
        <Stat
          n={totals.ryanFiledGrievances.toLocaleString()}
          label="Grievances he filed"
          href="/case?view=grievances"
        />
        <Stat
          n={totals.documents.toLocaleString()}
          label="Documents on the record"
          href="/case?view=documents"
        />
        <Stat
          n={String(totals.corroborators)}
          label="Fellow detainees on record"
          href="/case?view=people&filter=all"
        />
      </section>

      {/* ---- The line that should stop you ---- */}
      <aside className="mt-6 rounded-2xl border-2 border-[var(--color-navy)]/30 bg-[var(--color-blue-soft)]/40 p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-navy)] font-bold">
          On the record
        </p>
        <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight font-display leading-snug text-[var(--color-ink)]">
          A federal judge acknowledged — out loud, on the record — that his
          due-process rights had been violated. He stayed in anyway.
        </p>
        <Link
          href="/fights/equal-justice"
          className="mt-4 inline-block text-sm font-bold text-[var(--color-navy)] hover:underline"
        >
          Equal justice under the law — the fight that came out of it →
        </Link>
      </aside>

      {/* The archive this case anchors — the growth loop. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[var(--color-navy)]/30 bg-[var(--color-blue-soft)]/40 px-5 py-4">
        <p className="text-sm font-bold text-[var(--color-ink)]">
          This case anchors the{" "}
          <span className="text-[var(--color-navy)]">January 6 Case Archive</span>{" "}
          — every defendant who joins stacks their record into it.
        </p>
        <Link
          href="/j6"
          className="shrink-0 text-sm font-bold text-[var(--color-navy)] hover:underline"
        >
          Enter the archive →
        </Link>
      </div>

      {/* ---- Who he is, before the government ---- */}
      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          Chapter One · Before the case — the man behind the file
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Two decades running toward the disaster.
        </h2>
        <p className="mt-3 text-base text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
          Long before he was a case number, Ryan was the man wading into
          floodwater to pull strangers out. A U.S. Marine, then a civilian
          search-and-rescue volunteer across more than two dozen hurricane
          deployments.
        </p>

        {/* Service record */}
        <div className="mt-6 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
            Service record · USMC 2010–2014
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight font-display">
            United States Marine Corps
          </h3>
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
            {[
              ["Enlisted", "2010 — during two wars"],
              ["Discharge", "2014 — Honorable"],
              ["Rank", "Noncommissioned Officer"],
              ["Okinawa, Japan", "9th Communications Battalion"],
              ["Camp Pendleton", "2nd Bn, 1st Marines"],
              ["Led", "30+ Marines · ASF security"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
                  {k}
                </dt>
                <dd className="mt-0.5 font-semibold text-[var(--color-ink)] leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-[var(--color-line)] pt-4">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
              Decorations
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DECORATIONS.map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1 text-xs font-bold text-[var(--color-ink)]"
                >
                  🎖 {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Operations timeline */}
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
            Search & rescue · the operations log
          </p>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
            Two dozen-plus deployments. A partial record.
          </h3>
          <ol className="mt-5 relative border-l-2 border-[var(--color-line)] ml-3 space-y-5">
            {OPERATIONS.map((op) => (
              <li key={op.title} className="relative pl-6">
                <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-paper)]" />
                <Link href={`/story/${storySlugFor(op)}`} className="group block">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="rounded bg-[var(--color-ink)] text-[var(--color-paper)] px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                      {op.year}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold tracking-tight font-display transition group-hover:text-[var(--color-navy)]">
                      {op.title}
                    </h4>
                    <span
                      aria-hidden
                      className="text-xs font-bold text-[var(--color-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-navy)]"
                    >
                      →
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-snug">{op.detail}</p>
                  <span className="mt-0.5 inline-block text-xs font-bold text-[var(--color-navy)] opacity-0 transition group-hover:opacity-100">
                    Open this chapter — the full story, pictures, and record
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {/* Recognition */}
        <div className="mt-8 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-blue)] font-bold">
            Recognized for the rescues
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {RECOGNITION.map((r) => (
              <Link
                key={r}
                href={
                  r === "The Ellen Show"
                    ? "/story/hurricane-florence-2018"
                    : "/about"
                }
                className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-paper)] px-3 py-1 text-xs font-bold text-[var(--color-blue)] transition hover:border-[var(--color-blue)] hover:bg-[var(--color-blue-soft)]"
              >
                {r} →
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)] leading-snug">
            Ellen DeGeneres recognized his Hurricane Florence rescues on{" "}
            <em>The Ellen Show</em> — sponsoring Rescue the Universe with a new
            rescue boat and donating $25,000 to the Animal Humane Society in his
            honor.
          </p>
        </div>

        <Link
          href="/about"
          className="mt-6 inline-block text-sm font-bold text-[var(--color-accent)] hover:underline"
        >
          Read the full biography, filed as Exhibit 288 →
        </Link>
      </section>

      {/* ---- The case file (case number, court, disposition, charges) ---- */}
      <CaseInfoCard person={person} />

      {/* ---- The J6 case, start to finish ---- */}
      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          Chapter Two · The case, start to finish
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Arrested. Convicted. Pardoned.
        </h2>
        <ol className="mt-5 relative border-l-2 border-[var(--color-line)] ml-3 space-y-5">
          {[
            { date: "Jan 18, 2021", title: "Arrested", detail: "Taken into custody in the Eastern District of Texas." },
            { date: "2021", title: "Indicted", detail: "Charged with multiple counts tied to January 6." },
            { date: "Apr 26, 2021", title: "Arraigned", detail: "Initially pleaded not guilty." },
            {
              date: "Dec 2021",
              title: "Due process violated — on the record",
              detail:
                "A federal judge acknowledged from the bench that his due-process rights had been violated. He was held across ten federal and local facilities anyway.",
            },
            {
              date: "Aug 10, 2022",
              title: "Sued the Attorney General from his cell",
              detail:
                "Still detained, he petitioned for a writ of habeas corpus — Nichols v. Garland, 1:22-cv-02356 (D.D.C.) — naming Attorney General Merrick Garland and the DC jail leadership over his pretrial detention.",
              doc: "/case/documents/habeas-petition-2022",
            },
            {
              date: "Nov 22, 2022",
              title: "Released on personal recognizance",
              detail:
                "After 22 months of pretrial detention, Judge Thomas F. Hogan ordered release on personal recognizance. The habeas petition had been voluntarily dismissed weeks earlier.",
              doc: "/case/documents/docket-180-release-order",
            },
            {
              date: "Nov 2023",
              title: "Pleaded guilty",
              detail: "Pleaded guilty to two felonies: obstruction of an official proceeding and assaulting, resisting, or impeding officers.",
              doc: "/case/documents/ex537-plea-agreement",
            },
            {
              date: "May 2, 2024",
              title: "Convicted & sentenced",
              detail: "Sentenced to 63 months in federal prison and fined $200,000 — the largest fine imposed in any January 6 case.",
              doc: "/case/documents/docket-314-judgment",
            },
            {
              date: "Jan 20, 2025",
              title: "Fully pardoned",
              detail: "Granted a full and unconditional pardon by President Trump.",
              doc: "/case/documents/order-j6-presidential-pardon-2025",
            },
            {
              date: "2025",
              title: "Dismissed with prejudice",
              detail:
                "Following the pardon, the charges were dismissed with prejudice by U.S. Attorney Edward R. Martin Jr. — the case can never be brought again.",
            },
          ].map((e) => (
            <li key={e.date} className="relative pl-6">
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-paper)]" />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="rounded bg-[var(--color-ink)] text-[var(--color-paper)] px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                  {e.date}
                </span>
                <h3 className="text-base sm:text-lg font-bold tracking-tight font-display">{e.title}</h3>
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-snug">{e.detail}</p>
              {"doc" in e && e.doc ? (
                <Link
                  href={e.doc}
                  className="mt-1 inline-block text-xs font-bold text-[var(--color-navy)] hover:underline"
                >
                  Read the paper →
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* ---- The detention record — the documented account ---- */}
      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          Chapter Three · The detention record — {totals.daysDetained.toLocaleString()} days
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Not memoir. Paper.
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-2xl leading-relaxed">
          What happened between arrest and pardon is not a story he tells — it is
          a file he built, one exhibit at a time, from inside. Every entry below
          carries an exhibit number from the master archive or lives in the{" "}
          <Link href="/case?view=documents" className="text-[var(--color-accent)] font-semibold hover:underline">
            public document record
          </Link>
          . Items marked <DetTag kind="doc" /> are documented. Items marked{" "}
          <DetTag kind="account" /> are his sworn or stated account, with the
          corroborating records named.
        </p>

        <div className="mt-6 space-y-3">
          {[
            {
              tag: "doc" as const,
              title: "Solitary confinement",
              detail:
                "Documented from inside: inmates passing out in solitary (EX-258); the conditions record photographed and filed (EX-251, EX-256). A federal judge discussed his solitary confinement and due process on the record — preserved on video (EX-529).",
              paper: {
                href: "/case/documents/docket-150-emergency-release-motion",
                label: "The emergency release motion that put the conditions before the court",
              },
            },
            {
              tag: "doc" as const,
              title: "Due process violated — acknowledged from the bench",
              detail:
                "December 2021: U.S. District Judge Thomas F. Hogan acknowledged on the record that his due-process rights had been violated. He remained detained. The moment is preserved (EX-529) and became the foundation of the equal-justice fight.",
              paper: {
                href: "/case/documents/habeas-petition-2022",
                label: "The habeas petition that took the due-process fight to court",
              },
            },
            {
              tag: "doc" as const,
              title: "He sued the Attorney General from his cell",
              detail:
                "August 2022: a petition for a writ of habeas corpus — Nichols v. Garland, 1:22-cv-02356 (D.D.C.) — filed against Attorney General Merrick Garland and DC jail leadership while he was still detained. Voluntarily dismissed that October; weeks later the criminal court ordered his release.",
              paper: {
                href: "/case/documents/habeas-voluntary-dismissal-2022",
                label: "The dismissal notice — and the release order that followed",
              },
            },
            {
              tag: "doc" as const,
              title: "Officers threatening inmates — photographed",
              detail:
                "Two photographed instances of officers threatening detainees, preserved and filed (EX-260, EX-261), alongside his contemporaneous notes to fellow inmates (EX-262).",
            },
            {
              tag: "doc" as const,
              title: "The transport complaint — signed and filed",
              detail:
                "A signed complaint documenting a transport event, JMD 21-08-16, filed while in custody (EX-173). Full USMS transport records are under FOIA request.",
            },
            {
              tag: "doc" as const,
              title: "The medical record",
              detail:
                "PTSD diagnosis on file (EX-268; post-release diagnosis EX-005). Ketamine treatment records (EX-267). Alprazolam prescription (EX-269). Mental-health grievances and a FOIA request for complete BOP medical records are in the file (EX-007, EX-008).",
            },
            {
              tag: "doc" as const,
              title: "Congress was turned away at the door",
              detail:
                "Members of Congress — Reps. Louie Gohmert and Marjorie Taylor Greene — were denied access to the jail holding him. It is on video (EX-266).",
            },
            {
              tag: "account" as const,
              title: "The first plea offer: 10 to 12 years",
              detail:
                "His account of the government's opening position, preserved as a recorded discussion in the file (EX-015) — against a final sentence of 63 months, and then a full pardon and dismissal with prejudice.",
            },
            {
              tag: "doc" as const,
              title: `The grievance machine — ${totals.ryanFiledGrievances.toLocaleString()} forms in his own hand`,
              detail:
                "He papered every facility that held him: " +
                `${totals.ryanFiledGrievances.toLocaleString()} grievance forms he authored sit in the public archive; a master exhibit set (EX-319 through EX-519, indexed in EX-520) preserves them for the court record. ` +
                `${totals.grievances} distinct grievance patterns are documented across facilities.`,
              paper: {
                href: "/case?view=grievances",
                label: `Read all ${totals.grievances} documented grievance patterns, with the scans`,
              },
            },
            {
              tag: "doc" as const,
              title: "The discovery that cuts the other way",
              detail:
                "From his own discovery: officers letting protesters into the Capitol, on video (EX-217, EX-218, EX-219). FBI 302 interview reports (EX-032, EX-006). The DOJ's admitted withholding of exculpatory evidence in a related January 6 case (EX-022, EX-028). He maintains the prosecution was entrapment and lawfare; these are the exhibits that claim stands on.",
            },
            {
              tag: "doc" as const,
              title: "The video they don't lead with",
              detail:
                "Footage on file shows him helping Metropolitan Police Officer Michael Fanone to safety on January 6. It sits in the case file alongside 25+ character letters and seven sworn affidavits (EX-282 through EX-318).",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <DetTag kind={item.tag} />
                <h3 className="text-base font-bold tracking-tight text-[var(--color-ink)]">
                  {item.title}
                </h3>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {item.detail}
              </p>
              {"paper" in item && item.paper ? (
                <Link
                  href={item.paper.href}
                  className="mt-2 inline-block text-xs font-bold text-[var(--color-navy)] hover:underline"
                >
                  {item.paper.label} →
                </Link>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-[var(--color-surface-2)] p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-navy)]">
            The {totals.facilities} facilities, as he lists them
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              "Tyler, TX (E.D. Tex.)",
              "DC DOC — CTF",
              "Rappahannock Regional",
              "Northern Neck Regional",
              "FDC Houston",
              "Florence",
              "Oklahoma City (transit)",
              "Albany",
              "NW3 quarantine",
              "BOP (post-sentence)",
            ].map((f) => (
              <Link
                key={f}
                href="/case/geography"
                className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-soft)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
              >
                {f} →
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            His account. Official USMS transport and BOP records are under FOIA
            request; the list will carry document citations as they land. The
            file is still being built — provenance first.
          </p>
        </div>

        {/* Statement intake — the archive grows one account at a time. */}
        <div className="mt-8 rounded-2xl bg-[var(--color-navy)] p-6 sm:p-8 text-[#fdf8ea]">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#8194b4]">
            Statement intake
          </p>
          <h3 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display text-[#fdf8ea]">
            Were you there? The archive has room for your statement.
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#cfd9ea]">
            Detainees, witnesses, family — the record grows one account at a
            time. Sworn or notarized statements carry the most weight; voice
            recordings are accepted too. Every submission lands in the public
            intake ledger with provenance intact.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              href="/case/intake"
              className="inline-flex items-center rounded-lg bg-[#fdf8ea] px-5 py-2.5 text-sm font-bold text-[var(--color-navy)] transition hover:bg-white"
            >
              Add your statement →
            </Link>
            <Link
              href="/tell-your-story"
              className="text-sm font-bold text-[#cfd9ea] transition hover:text-[#fdf8ea] hover:underline"
            >
              Record it in your own voice →
            </Link>
          </div>
        </div>

        {/* Share moment — placed right after the heaviest chapter, where a
            reader who made it this far is most likely to pass it on. */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-bold text-[var(--color-ink)]">
            If this chapter stopped you, it will stop someone else. Put it in
            front of one more person.
          </p>
          <ShareButton
            url={url}
            title={`The detention record of ${person.name} — ${totals.daysDetained.toLocaleString()} days, documented on paper. Read it and check it yourself:`}
            slug={person.slug}
            caseKind="person"
            compact
          />
        </div>
      </section>

      {/* The political fights (water rights, First Amendment, tax fairness…)
          deliberately do NOT live on the case page — this page is January 6,
          period. They keep their own home at /fights. */}

      {/* ---- On the record now (latest dispatches) ---- */}
      {titledPosts.length > 0 ? (
        <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
            Chapter Four · On the record now
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
            He didn&apos;t go quiet. He built a newsroom.
          </h2>
          <p className="mt-3 text-base text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
            Ryan reports on his own case — and the weaponization of the justice
            system — as an independent investigative journalist. The latest:
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {titledPosts.map((p) => (
              <Link
                key={p.slug}
                href={`/posts/${p.slug}`}
                className="group overflow-hidden rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={postThumb(p)}
                  alt=""
                  loading="lazy"
                  className="h-28 w-full border-b border-[var(--color-line)] object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--color-accent)]">
                    {p.category ? <span>{p.category}</span> : null}
                    {p.published_at ? (
                      <span className="text-[var(--color-muted)]">
                        {new Date(p.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-base font-bold tracking-tight font-display leading-snug group-hover:text-[var(--color-accent)] transition">
                    {p.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/" className="mt-5 inline-block text-sm font-bold text-[var(--color-accent)] hover:underline">
            See everything in the feed →
          </Link>
        </section>
      ) : null}

      {/* ---- Evidence on file ---- */}
      <section className="mt-12 border-t border-[var(--color-line)] pt-8">
        <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
            Evidence on file
          </p>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {evidence.length === 0
              ? "Linked from the wider record"
              : "The documents that name him directly"}
          </h2>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-2xl">
            {evidence.length > EVIDENCE_SAMPLE
              ? `A sample of ${EVIDENCE_SAMPLE} from the ${evidence.length.toLocaleString()} documents that name him directly. `
              : ""}
            His name runs through the whole case file —{" "}
            {totals.documents.toLocaleString()} documents,{" "}
            {totals.ryanFiledGrievances.toLocaleString()} grievance forms in his own hand,{" "}
            {totals.grievances} documented grievance patterns, {totals.facilities} facilities.{" "}
            <Link href="/case?view=documents" className="text-[var(--color-accent)] font-semibold hover:underline">
              Walk the full record →
            </Link>
          </p>
          <Link
            href="/case?view=documents"
            className="btn-accent mt-3 inline-flex items-center px-5 py-2.5 text-sm"
          >
            Open all {totals.documents.toLocaleString()} documents →
          </Link>
        </div>
        {/* Capped hard: this is a biography page, not the archive. The wall of
            hundreds of cards buried everything below it; the full set lives in
            the documents view one tap away. */}
        <EvidenceGrid documents={evidence.slice(0, EVIDENCE_SAMPLE)} />
        <div className="mt-4">
          <CaseStats views={person.views_count} shares={person.shares_count} />
        </div>
      </section>

      {/* Attorney briefing — below the story now. Counsel jumps straight
          here via the chip under the breadcrumb; strangers get the human
          story first. Same public-facts-only content as before. */}
      <div id="attorney-briefing" className="scroll-mt-24">
        <AttorneyBriefing />
      </div>

      {/* ---- The full record · a directory into every part of the case ---- */}
      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          The full record
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Everything is public. Walk it yourself.
        </h2>
        <p className="mt-3 text-base text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
          Nothing here sits behind a paywall or a login. Every grievance, every
          document, every name — open, sourced, and laid out to be checked.
        </p>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-3">
          <CrossLink href="/case" title="The case hub" sub="Start here — the whole file, organized" />
          <CrossLink href="/case?view=timeline" title="Timeline" sub="Arrest to pardon, day by day" />
          <CrossLink
            href="/case?view=grievances"
            title="Grievances"
            sub={`${totals.grievances} documented, with the paperwork`}
          />
          <CrossLink
            href="/case?view=documents"
            title="Documents"
            sub={`${totals.documents.toLocaleString()} scans on the record`}
          />
          <CrossLink
            href="/case/witnesses"
            title="Co-detainees & witnesses"
            sub={`${totals.corroborators} who corroborate the record`}
          />
          <CrossLink href="/case/officials" title="Officials named" sub="Who did what, on the record" />
          <CrossLink
            href="/case/geography"
            title="Geography"
            sub={`The ${totals.facilities} facilities he moved through`}
          />
          <CrossLink href="/case/damages" title="Damages" sub="What four years of this cost" />
          <CrossLink href="/about" title="Full biography" sub="Exhibit 288, in his words" />
        </div>
      </section>

      {/* ---- Study this case — the researcher's on-ramp ---- */}
      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-navy)] font-bold">
          Study this case
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Built to be checked, cited, and taught.
        </h2>
        <p className="mt-3 text-base text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
          This page and the archive behind it exist so journalists, lawyers,
          students, and historians can study United States v. Nichols from the
          primary record — court filings linked at their official source,
          grievance scans, transcripts, and sworn statements, each labeled for
          what it is (FACT / RYAN STATEMENT / NEEDS AUTHENTICATION).
        </p>
        <div className="mt-5 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
            How to cite this archive
          </p>
          <p className="mt-2 font-mono text-xs sm:text-sm leading-relaxed text-[var(--color-ink)] break-words">
            Nichols, Ryan. <em>The J6 Case Archive: United States v. Nichols</em>,
            No. 1:21-cr-00117 (D.D.C.). RealRyanNichols.com.
            https://www.realryannichols.com/case
          </p>
          <p className="mt-3 text-xs text-[var(--color-muted)] leading-relaxed">
            Cite individual documents by their own URL — every scan, filing, and
            grievance has a permanent page. Court records link to CourtListener/RECAP
            so you can verify against the official docket yourself. Related habeas
            matter: Nichols v. Garland, No. 1:22-cv-02356 (D.D.C.).
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-bold">
            <Link href="/case?view=documents" className="text-[var(--color-navy)] hover:underline">
              The full document archive →
            </Link>
            <Link href="/case?view=timeline" className="text-[var(--color-navy)] hover:underline">
              The dated timeline →
            </Link>
            <a href="/llms.txt" className="text-[var(--color-navy)] hover:underline">
              Machine-readable overview (llms.txt) →
            </a>
            <a href="/rss.xml" className="text-[var(--color-navy)] hover:underline">
              RSS →
            </a>
          </div>
        </div>
      </section>

      {/* ---- Case Builder — this page is the product demo ---- */}
      <section className="mt-12 rounded-2xl border-2 border-[var(--color-navy)] bg-[var(--color-surface)] p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-navy)] font-bold">
          Case Builder
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Fighting a case the public should see? He builds these.
        </h2>
        <p className="mt-3 text-base text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
          Everything on this page — the classified evidence, the dated
          timeline, the people of record, the court filings linked at their
          official source — is a system Ryan builds for other people&apos;s
          cases too. Yours could look exactly like this, and be just as hard
          to bury.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href="/case-builder"
            className="btn-accent inline-flex items-center px-6 py-3 text-sm"
          >
            Request a case build →
          </Link>
          <Link
            href="/j6"
            className="text-sm font-bold text-[var(--color-navy)] hover:underline"
          >
            J6 defendant? Yours is free →
          </Link>
        </div>
      </section>

      {/* ---- Closing CTA · stand with him ---- */}
      <section className="mt-12">
        <div className="rounded-3xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] p-6 sm:p-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-accent)] font-bold">
            Stand with him
          </p>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight font-display leading-[1.06] max-w-2xl mx-auto">
            He kept the receipts. Help keep them public.
          </h2>
          <p className="mt-4 text-base text-[var(--color-ink-soft)] leading-relaxed max-w-xl mx-auto">
            Keeping this record up — the filings, the scans, the names — takes work and
            nerve. The best way to help: read it, and put this page in front of one more
            person.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book"
              className="inline-flex items-center rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] px-6 py-3 text-sm font-bold hover:opacity-90 transition"
            >
              Get the book →
            </Link>
            <ShareButton
              url={url}
              title={`${person.name} — pardoned January 6 defendant, charges dismissed with prejudice. The full record:`}
              slug={person.slug}
              caseKind="person"
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-[var(--color-muted)]">
            <Link href="/the-harassment" className="hover:text-[var(--color-accent)] font-semibold">
              The harassment wall →
            </Link>
            <Link href="/" className="hover:text-[var(--color-accent)] font-semibold">
              The latest dispatches →
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}

// Attorney-facing briefing block. PUBLIC — every line here is either already
// public record or a published motion of Ryan's. Deliberately omits bond
// status, hearing dates, and anything that reads as an admission; those go to
// counsel privately. Goal: give a lawyer the current posture + the live issues
// + a contact path in the first ten seconds.
function AttorneyBriefing() {
  const issues: { label: string; sub: string; href: string }[] = [
    {
      label: "First Amendment / bond conditions",
      sub: "Speech & publication restrictions challenged as overbroad prior restraint (Packingham, Near, Davenport).",
      href: "/posts/motion-2-speech-bond-conditions",
    },
    {
      label: "Brady & Article 39.14 discovery",
      sub: "Demand for bodycam, CAD, dispatch, and officer notes through criminal discovery.",
      href: "/posts/motion-4-39-14-brady-discovery",
    },
    {
      label: "Bodycam preservation & release",
      sub: "Emergency motion to preserve and produce the recording said to settle the church allegation.",
      href: "/posts/motion-3-preserve-produce-bodycam",
    },
    {
      label: "Right to counsel — no waiver",
      sub: "Pro se filings do not waive counsel; appointment sought (Gideon, Argersinger, Rothgery).",
      href: "/posts/motion-1-no-waiver-appointment-of-counsel",
    },
    {
      label: "Recusal",
      sub: "Motion to recuse, with supporting exhibits, filed in the current matter.",
      href: "/posts/recuse-judge-joe-black",
    },
    {
      label: "Protective order",
      sub: "Against documented online threats and the escalating rumor narrative.",
      href: "/posts/motion-6-protective-order",
    },
  ];

  return (
    <section className="rounded-3xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-ink)] p-6 sm:p-9">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--color-blue)] text-[var(--color-paper)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
          Attorney briefing
        </span>
        <span className="rounded-full border border-[var(--color-blue)]/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-blue)]">
          Seeking counsel
        </span>
      </div>

      <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight font-display leading-[1.08] text-[var(--color-blue-strong)]">
        Counsel evaluating my case — start here.
      </h2>
      <p className="mt-3 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
        I&apos;m a <strong className="text-[var(--color-ink)]">pardoned January 6 defendant</strong>{" "}
        — federal charges <strong className="text-[var(--color-ink)]">dismissed with prejudice</strong>,
        cannot be refiled. I am now defending an{" "}
        <strong className="text-[var(--color-ink)]">active matter in Harrison County, Texas</strong>,
        currently <strong className="text-[var(--color-ink)]">pro se and seeking representation</strong>.
        I am <strong className="text-[var(--color-ink)]">not</strong> waiving counsel. The live legal
        issues are below, each tied to a motion I have already filed and published.
      </p>

      {/* Snapshot — public-safe facts only */}
      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Posture", "Active · pro se"],
          ["Venue", "Harrison County, TX"],
          ["Prior matter", "Pardoned · dismissed w/ prejudice"],
          ["Motions filed", "11 + recusal, public"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-paper)] p-3">
            <dt className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">{k}</dt>
            <dd className="mt-1 text-sm font-bold text-[var(--color-ink)] leading-snug">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Live issues, each linked to the filed motion */}
      <div className="mt-7">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-blue)] font-bold">
          Live legal issues · with the filed motion
        </p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {issues.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="group rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-paper)] p-4 hover:border-[var(--color-blue)] transition"
            >
              <p className="text-sm font-bold text-[var(--color-ink)] group-hover:text-[var(--color-blue)] transition leading-snug">
                {it.label}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-snug">{it.sub}</p>
            </Link>
          ))}
        </div>
        <Link
          href="/posts/the-transparency-motions-what-i-filed-and-why"
          className="mt-3 inline-block text-sm font-bold text-[var(--color-blue)] hover:underline"
        >
          Read all eleven motions, why I filed each, and the exhibit index →
        </Link>
      </div>

      {/* Contact — attorneys */}
      <div className="mt-7 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-paper)] p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-blue)] font-bold">
          Attorneys — reach me directly
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
          If you practice criminal defense, First Amendment, or civil-rights litigation
          and want the full private briefing, contact me. I can send the complete
          packet — motions, declarations, exhibit index, and the case-specific
          details that aren&apos;t on this public page.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href="mailto:ryan@realryannichols.com?subject=Attorney%20inquiry%20%E2%80%94%20Harrison%20County%20matter&body=Hi%20Ryan%2C%0A%0AI%27m%20an%20attorney%20licensed%20in%20%5Bstate%5D.%20My%20practice%20areas%3A%20%5Bareas%5D.%0A%0AI%27d%20like%20the%20full%20private%20briefing%20on%20your%20current%20matter.%0A%0A%5BName%2C%20firm%2C%20bar%20number%2C%20phone%5D"
            className="inline-flex items-center rounded-full bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)] transition"
          >
            ✉ Email me about representation
          </a>
          <Link
            href="/submit"
            className="inline-flex items-center rounded-full border border-[var(--color-blue)]/40 px-5 py-2.5 text-sm font-bold text-[var(--color-blue)] hover:bg-[var(--color-blue)] hover:text-[var(--color-paper)] transition"
          >
            Send a secure note →
          </Link>
        </div>
        <p className="mt-3 text-[11px] text-[var(--color-muted)] leading-snug">
          This page is public; it states only already-public facts and links to
          motions I have already filed. Case-specific posture and strategy are
          shared privately with counsel.
        </p>
      </div>
    </section>
  );
}

function DetTag({ kind }: { kind: "doc" | "account" }) {
  return kind === "doc" ? (
    <span className="rounded-full bg-[var(--color-navy)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#fdf8ea]">
      Documented
    </span>
  ) : (
    <span className="rounded-full border border-[var(--color-navy)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--color-navy)]">
      His account
    </span>
  );
}

function Stat({ n, label, href }: { n: string; label: string; href?: string }) {
  const inner = (
    <>
      <div className="text-3xl sm:text-[2.4rem] font-bold tracking-tight leading-none text-[var(--color-navy)] font-display tabular-nums">
        {n}
      </div>
      <div className="mt-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.08em] text-[var(--color-support-strong)] leading-tight">
        {label}
        {href ? <span aria-hidden> →</span> : null}
      </div>
    </>
  );
  const shell = "qa-tile p-4 sm:p-5";
  return href ? (
    <Link href={href} className={`${shell} block`}>
      {inner}
    </Link>
  ) : (
    <div className={shell}>{inner}</div>
  );
}

function CrossLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition group"
    >
      <p className="text-sm font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {title}
      </p>
      <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">{sub}</p>
    </Link>
  );
}
