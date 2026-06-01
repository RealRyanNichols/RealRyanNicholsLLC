import Link from "next/link";
import type { CasePerson, CaseDocument } from "@/lib/case";
import { ROLE_LINE, DECORATIONS, OPERATIONS, RECOGNITION } from "@/lib/bio";
import { FIGHTS } from "@/lib/fights";
import { CaseViewTracker } from "@/components/CaseViewTracker";
import { ShareButton } from "@/components/ShareButton";
import { CaseInfoCard } from "@/components/CaseInfoCard";
import { CaseStats } from "@/components/CaseStats";
import { EvidenceGrid } from "@/components/EvidenceGrid";
import { ReactionBar } from "@/components/ReactionBar";
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

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <CaseViewTracker type="person" slug={person.slug} />

      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/case" className="hover:underline">
          ← J6 Case
        </Link>{" "}
        ·{" "}
        <Link href="/case?view=people" className="hover:underline">
          All people
        </Link>
      </nav>

      {/* ============================================================
          ATTORNEY BRIEFING — front-loaded for counsel evaluating the
          CURRENT matter. PUBLIC PAGE: contains only already-public facts
          and links to already-published motions. No bond status, no
          hearing dates, no self-admissions — sensitive specifics move to
          the private attorney conversation.
          ============================================================ */}
      <AttorneyBriefing />

      {/* ---- Hero ---- */}
      <div className="rounded-3xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] p-6 sm:p-9">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-accent)] font-bold">
          Verified subject · United States v. Nichols
        </p>
        <h1 className="mt-2 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] font-display">
          {person.name}
        </h1>
        <p className="mt-3 text-sm sm:text-base font-semibold text-[var(--color-ink)] leading-relaxed">
          {ROLE_LINE}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] px-3 py-1 text-xs font-bold">
            ★ Pardoned — Jan 20, 2025
          </span>
          <span className="rounded-full border-2 border-[var(--color-success)] text-[var(--color-success)] px-3 py-1 text-xs font-bold">
            ✓ All charges dismissed with prejudice
          </span>
          <span className="rounded-full border border-[var(--color-line)] text-[var(--color-muted)] px-3 py-1 text-xs font-bold">
            Cannot be brought again
          </span>
        </div>
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
      <section className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat n={String(totals.facilities)} label="Facilities held across" />
        <Stat n={totals.daysDetained.toLocaleString()} label="Days, arrest → pardon" />
        <Stat n={totals.ryanFiledGrievances.toLocaleString()} label="Grievances he filed" />
        <Stat n={totals.documents.toLocaleString()} label="Documents on the record" />
        <Stat n={String(totals.corroborators)} label="Fellow detainees on record" />
      </section>

      {/* ---- The line that should stop you ---- */}
      <aside className="mt-6 rounded-2xl bg-[var(--color-ink)] text-[var(--color-paper)] p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          On the record
        </p>
        <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight font-display leading-snug">
          A federal judge acknowledged — out loud, on the record — that his
          due-process rights had been violated. He stayed in anyway.
        </p>
        <Link
          href="/fights/equal-justice"
          className="mt-4 inline-block text-sm font-bold text-[var(--color-accent)] hover:underline"
        >
          Equal justice under the law — the fight that came out of it →
        </Link>
      </aside>

      {/* ---- The case file (case number, court, disposition, charges) ---- */}
      <CaseInfoCard person={person} />

      {/* ---- The J6 case, start to finish ---- */}
      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          The case · start to finish
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Arrested to exonerated.
        </h2>
        <ol className="mt-5 relative border-l-2 border-[var(--color-line)] ml-3 space-y-5">
          {[
            { date: "Jan 18, 2021", title: "Arrested", detail: "Taken into custody in the Eastern District of Texas." },
            { date: "Feb 12, 2021", title: "Indicted", detail: "Charged with ten counts tied to January 6." },
            { date: "Apr 26, 2021", title: "Arraigned", detail: "Pleaded not guilty to all counts." },
            {
              date: "Dec 2021",
              title: "Due process violated — on the record",
              detail:
                "A federal judge acknowledged from the bench that his due-process rights had been violated. He was held across ten federal and local facilities anyway.",
            },
            { date: "Jan 20, 2025", title: "Fully pardoned", detail: "Granted a full and unconditional pardon by President Trump." },
            {
              date: "2025",
              title: "Dismissed with prejudice",
              detail:
                "Every charge dismissed with prejudice by U.S. Attorney Edward R. Martin Jr. — the case can never be brought again.",
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
            </li>
          ))}
        </ol>
      </section>

      {/* ---- Who he is, before the government ---- */}
      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          Before the case · the man behind the file
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
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded bg-[var(--color-ink)] text-[var(--color-paper)] px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                    {op.year}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold tracking-tight font-display">
                    {op.title}
                  </h4>
                </div>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-snug">{op.detail}</p>
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
              <span
                key={r}
                className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-paper)] px-3 py-1 text-xs font-bold text-[var(--color-blue)]"
              >
                {r}
              </span>
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

      {/* ---- The fight now ---- */}
      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          What he&apos;s fighting for now
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Out the other side — and on offense.
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {FIGHTS.map((f) => (
            <Link
              key={f.slug}
              href={`/fights/${f.slug}`}
              className="group rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
                {f.tag}
              </p>
              <p className="mt-1 text-lg font-bold tracking-tight font-display group-hover:text-[var(--color-accent)] transition">
                {f.title}
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-snug line-clamp-2">
                {f.stakes}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- On the record now (latest dispatches) ---- */}
      {titledPosts.length > 0 ? (
        <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
            On the record now
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
                className="group rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition"
              >
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
            {evidence.length > 0 ? "A sample pulled to this profile. " : ""}His name runs
            through the whole case file — {totals.documents.toLocaleString()} documents and{" "}
            {totals.grievances} documented grievances across {totals.facilities} facilities.{" "}
            <Link href="/case?view=documents" className="text-[var(--color-accent)] font-semibold hover:underline">
              Walk the full record →
            </Link>
          </p>
        </div>
        <EvidenceGrid documents={evidence} />
        <div className="mt-4">
          <CaseStats views={person.views_count} shares={person.shares_count} />
        </div>
      </section>

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
            Keeping this record up — the filings, the scans, the names — costs money and
            takes nerve. Two ways to help right now: back the rebuild, or put this page in
            front of one more person.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/support"
              className="inline-flex items-center rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] px-6 py-3 text-sm font-bold hover:opacity-90 transition"
            >
              Back the rebuild →
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
            <Link href="/impact" className="hover:text-[var(--color-accent)] font-semibold">
              Where the money goes →
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

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="text-2xl sm:text-3xl font-bold tracking-tight leading-none text-[var(--color-accent)] font-display tabular-nums">
        {n}
      </div>
      <div className="mt-2 text-xs sm:text-sm font-bold text-[var(--color-ink)] leading-tight">
        {label}
      </div>
    </div>
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
