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
  url,
}: {
  person: CasePerson;
  evidence: CaseDocument[];
  totals: CaseTotals;
  url: string;
}) {
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

      {/* ---- Evidence on file ---- */}
      <section className="mt-12 border-t border-[var(--color-line)] pt-8">
        <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
            Evidence on file
          </p>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {evidence.length === 0
              ? "Linked from the wider record"
              : `${evidence.length} ${evidence.length === 1 ? "document" : "documents"} linked to him directly`}
          </h2>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-2xl">
            His name runs through the whole case file — {totals.documents.toLocaleString()}{" "}
            documents and {totals.grievances} documented grievances.{" "}
            <Link href="/case" className="text-[var(--color-accent)] font-semibold hover:underline">
              Walk the full record →
            </Link>
          </p>
        </div>
        <EvidenceGrid documents={evidence} />
        <div className="mt-4">
          <CaseStats views={person.views_count} shares={person.shares_count} />
        </div>
      </section>

      {/* ---- Cross-links ---- */}
      <section className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CrossLink href="/about" title="Full biography" sub="Exhibit 288, in her words" />
        <CrossLink href="/case" title="The J6 Case" sub="Every grievance & document" />
        <CrossLink href="/the-harassment" title="The Receipts Wall" sub="Every brigade, threat & ban" />
        <CrossLink href="/support" title="Back the rebuild" sub="Fund keeping this public" />
      </section>
    </article>
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
