import { format } from "date-fns";
import type { CasePerson } from "@/lib/case";

// Renders the structured case data a verified J6 claimant has filled in
// on their /account workspace. Shows nothing if every field is empty —
// avoids a hollow "Case file" header.
export function CaseInfoCard({ person }: { person: CasePerson }) {
  const hasIdentity =
    person.case_number ||
    person.court ||
    person.judge_name ||
    person.prosecutor_name ||
    person.defense_attorney ||
    person.disposition;
  const hasDates =
    person.arrest_date || person.plea_date || person.sentence_date;
  const hasCharges = person.charges && person.charges.length > 0;
  const hasSentence = !!person.sentence_summary;
  const hasNews = person.news_links && person.news_links.length > 0;
  const hasSupport = !!person.support_url;

  if (
    !hasIdentity &&
    !hasDates &&
    !hasCharges &&
    !hasSentence &&
    !hasNews &&
    !hasSupport
  ) {
    return null;
  }

  return (
    <section className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        The case file
      </p>
      <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
        On the record
      </h2>

      {hasIdentity ? (
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {person.case_number ? (
            <Row label="Case number" value={person.case_number} mono />
          ) : null}
          {person.court ? <Row label="Court" value={person.court} /> : null}
          {person.judge_name ? (
            <Row label="Judge" value={person.judge_name} />
          ) : null}
          {person.prosecutor_name ? (
            <Row label="Prosecutor" value={person.prosecutor_name} />
          ) : null}
          {person.defense_attorney ? (
            <Row label="Defense attorney" value={person.defense_attorney} />
          ) : null}
          {person.disposition ? (
            <Row label="Disposition" value={person.disposition} />
          ) : null}
        </dl>
      ) : null}

      {hasDates ? (
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          {person.arrest_date ? (
            <Row label="Arrested" value={fmtDate(person.arrest_date)} />
          ) : null}
          {person.plea_date ? (
            <Row label="Plea" value={fmtDate(person.plea_date)} />
          ) : null}
          {person.sentence_date ? (
            <Row label="Sentenced" value={fmtDate(person.sentence_date)} />
          ) : null}
        </dl>
      ) : null}

      {hasCharges ? (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold mb-2">
            Charges
          </p>
          <ul className="space-y-1.5">
            {(person.charges ?? []).map((c) => (
              <li
                key={c}
                className="text-sm font-mono text-[var(--color-ink)] before:content-['§'] before:mr-2 before:text-[var(--color-accent)]"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasSentence ? (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold mb-2">
            Sentence
          </p>
          <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed">
            {person.sentence_summary}
          </p>
        </div>
      ) : null}

      {hasNews ? (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold mb-2">
            Press & news
          </p>
          <ul className="space-y-1.5">
            {(person.news_links ?? []).map((url) => (
              <li key={url} className="text-sm">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] hover:underline break-all"
                >
                  {url} →
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasSupport ? (
        <a
          href={person.support_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
        >
          Support {person.name.split(/\s+/)[0]} →
        </a>
      ) : null}
    </section>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "text-sm font-mono text-[var(--color-ink)]"
            : "text-sm text-[var(--color-ink)]"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function fmtDate(d: string): string {
  try {
    return format(new Date(d), "MMMM d, yyyy");
  } catch {
    return d;
  }
}
