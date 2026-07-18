import Link from "next/link";
import type { OfficialDossier as Dossier, ClaimLabel } from "@/lib/officials";
import type { CasePerson } from "@/lib/case";
import { ShareButton } from "@/components/ShareButton";
import { ReactionBar } from "@/components/ReactionBar";
import { CaseStats } from "@/components/CaseStats";

// The color + tone for each evidence label. This is the legend that makes the
// dossier honest at a glance: a court record does not look like an opinion, and
// an opinion does not look like a proven fact.
const LABELS: Record<
  ClaimLabel,
  { color: string; bg: string; blurb: string }
> = {
  FACT: {
    color: "var(--color-navy)",
    bg: "color-mix(in srgb, var(--color-navy) 7%, transparent)",
    blurb: "Verifiable, uncontested.",
  },
  RECORD: {
    color: "var(--color-blue)",
    bg: "color-mix(in srgb, var(--color-blue) 9%, transparent)",
    blurb: "Stated on the court record.",
  },
  "RYAN STATEMENT": {
    color: "var(--color-accent)",
    bg: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
    blurb: "Ryan's own account.",
  },
  "DOCUMENTED INFERENCE": {
    color: "#b6892a",
    bg: "color-mix(in srgb, #b6892a 10%, transparent)",
    blurb: "Drawn from disclosed, sourced facts.",
  },
  "NEEDS AUTHENTICATION": {
    color: "var(--color-muted)",
    bg: "color-mix(in srgb, var(--color-muted) 8%, transparent)",
    blurb: "Real and load-bearing, not yet verified.",
  },
};

const ORDER: ClaimLabel[] = [
  "FACT",
  "RECORD",
  "RYAN STATEMENT",
  "DOCUMENTED INFERENCE",
  "NEEDS AUTHENTICATION",
];

function LabelTag({ label }: { label: ClaimLabel }) {
  const s = LABELS[label];
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {label}
    </span>
  );
}

export function OfficialDossier({
  dossier,
  person,
  url,
}: {
  dossier: Dossier;
  person: CasePerson;
  url: string;
}) {
  // Only show legend rows for labels actually used on this dossier.
  const usedLabels = ORDER.filter((l) =>
    dossier.claims.some((c) => c.label === l),
  );

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-5 text-sm text-[var(--color-muted)]">
        <Link href="/case" className="hover:underline">
          ← J6 Case
        </Link>{" "}
        ·{" "}
        <Link href="/case?view=people" className="hover:underline">
          All people
        </Link>
      </nav>

      {/* Header plate — dark "case file" band so an official's dossier reads as
          a record, not a bio. */}
      <div className="overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[#0b1428] text-white shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          {/* Photo / seal */}
          <div className="shrink-0">
            {dossier.photoUrl ? (
              <div className="h-28 w-28 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dossier.photoUrl}
                  alt={dossier.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-[#16223f] to-[#0b1428]">
                <span className="font-display text-3xl font-black tracking-tight text-white/90">
                  {dossier.seal}
                </span>
                <span className="mt-1 px-2 text-center text-[8px] font-semibold uppercase leading-tight tracking-wider text-white/45">
                  Photo pending verified public image
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              {dossier.kicker}
            </p>
            <h1 className="mt-1 font-display text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              {dossier.name}
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-white/70">
              {dossier.role} · {dossier.agency}
            </p>
          </div>
        </div>
      </div>

      {/* Standfirst */}
      <p className="mt-7 text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg">
        {dossier.standfirst}
      </p>

      {/* Why this page exists */}
      <div className="mt-6 rounded-2xl border-l-4 border-[var(--color-accent)] bg-[var(--color-surface)] px-5 py-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Why this profile exists
        </p>
        <p className="mt-1.5 font-display text-lg font-bold leading-snug text-[var(--color-ink)]">
          {dossier.whyLine}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ShareButton
          url={url}
          title={`${dossier.name} — the record · United States v. Nichols`}
          slug={dossier.slug}
          caseKind="person"
        />
        <CaseStats views={person.views_count} shares={person.shares_count} />
      </div>

      {/* Legend */}
      <div className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">
          How to read this record
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {usedLabels.map((l) => (
            <div key={l} className="flex items-center gap-2">
              <LabelTag label={l} />
              <span className="text-xs text-[var(--color-ink-soft)]">
                {LABELS[l].blurb}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* The record — labeled claims */}
      <section className="mt-8">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
          The record
        </p>
        <div className="mt-4 space-y-4">
          {dossier.claims.map((c, i) => {
            const s = LABELS[c.label];
            return (
              <div
                key={i}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5"
                style={{ borderLeft: `4px solid ${s.color}` }}
              >
                <LabelTag label={c.label} />
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)] sm:text-base">
                  {c.text}
                </p>
                {c.source ? (
                  c.source.external ? (
                    <a
                      href={c.source.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-2 inline-block text-xs font-bold text-[var(--color-navy)] hover:underline"
                    >
                      {c.source.label} ↗
                    </a>
                  ) : (
                    <Link
                      href={c.source.href}
                      className="mt-2 inline-block text-xs font-bold text-[var(--color-navy)] hover:underline"
                    >
                      {c.source.label} →
                    </Link>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Conduct timeline */}
      {dossier.timeline.length > 0 ? (
        <section className="mt-10">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
            The sequence
          </p>
          <ol className="mt-4 relative ml-3 space-y-5 border-l-2 border-[var(--color-line)]">
            {dossier.timeline.map((t, i) => (
              <li key={i} className="relative pl-6">
                <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-paper)]" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded bg-[var(--color-ink)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-paper)]">
                    {t.tag}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-muted)]">
                    {t.when}
                  </span>
                </div>
                {t.href ? (
                  <Link href={t.href} className="group mt-1 block">
                    <h3 className="font-display text-base font-bold tracking-tight transition group-hover:text-[var(--color-navy)] sm:text-lg">
                      {t.title} →
                    </h3>
                    <p className="mt-0.5 text-sm leading-snug text-[var(--color-ink-soft)]">
                      {t.detail}
                    </p>
                  </Link>
                ) : (
                  <>
                    <h3 className="mt-1 font-display text-base font-bold tracking-tight sm:text-lg">
                      {t.title}
                    </h3>
                    <p className="mt-0.5 text-sm leading-snug text-[var(--color-ink-soft)]">
                      {t.detail}
                    </p>
                  </>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* What this proves / does not prove */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-[var(--color-navy)]/25 bg-[var(--color-blue-soft)]/40 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-navy)]">
            What the record shows
          </p>
          <ul className="mt-3 space-y-2">
            {dossier.proves.map((p, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-[var(--color-ink)]"
              >
                <span aria-hidden className="text-[var(--color-navy)]">
                  ✓
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
            What it does not prove yet
          </p>
          <ul className="mt-3 space-y-2">
            {dossier.notProven.map((p, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-[var(--color-ink-soft)]"
              >
                <span aria-hidden className="text-[var(--color-muted)]">
                  •
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What I need next */}
      <section className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
          What I need next
        </p>
        <ul className="mt-3 space-y-2">
          {dossier.needs.map((n, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm leading-relaxed text-[var(--color-ink)]"
            >
              <span aria-hidden className="text-[var(--color-accent)]">
                →
              </span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Sources */}
      <section className="mt-6">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Sources
        </p>
        <ul className="mt-3 space-y-2">
          {dossier.sources.map((src, i) => (
            <li key={i} className="text-sm">
              {src.external ? (
                <a
                  href={src.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-semibold text-[var(--color-navy)] hover:underline"
                >
                  {src.label} ↗
                </a>
              ) : (
                <Link
                  href={src.href}
                  className="font-semibold text-[var(--color-navy)] hover:underline"
                >
                  {src.label} →
                </Link>
              )}
              {src.note ? (
                <span className="text-[var(--color-muted)]"> — {src.note}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {/* Standard call to action — the archive's rule of engagement. */}
      <section className="mt-8 rounded-2xl border-2 border-[var(--color-navy)]/30 bg-[var(--color-blue-soft)]/40 p-5 sm:p-6">
        <p className="font-display text-lg font-bold leading-snug text-[var(--color-ink)]">
          Do not threaten anyone. Do not harass anyone. Do not contact him in my
          name.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Read it. Share it. Send receipts, records, and witnesses. Put eyes on
          the docket. The tape is the tape — let it speak.
        </p>
        <div className="mt-4">
          <ReactionBar
            targetType="person"
            targetId={dossier.slug}
            prompt="Put eyes on this record — tap to react, no signup"
          />
        </div>
      </section>
    </article>
  );
}
