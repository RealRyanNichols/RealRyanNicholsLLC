"use client";

import { useMemo, useState, type ReactNode } from "react";

type ProtectionMode = "anonymous" | "role" | "named";

const SAMPLE = {
  issue:
    "A local office refused to release public records after multiple written requests, then gave different explanations for why the records were unavailable.",
  location: "East Texas",
  actor: "a county office",
  evidence:
    "Email requests, date-stamped replies, a screenshot of the portal, and the name of the records custodian.",
};

const modes: {
  value: ProtectionMode;
  label: string;
  description: string;
}[] = [
  {
    value: "anonymous",
    label: "Conceal me",
    description: "Uses source language and keeps identifying details out.",
  },
  {
    value: "role",
    label: "Use my role",
    description: "Identifies the source by safe role, not name.",
  },
  {
    value: "named",
    label: "On record",
    description: "Shows how a named source would be framed.",
  },
];

function clean(value: string, fallback: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 260) || fallback;
}

function sourceLine(mode: ProtectionMode, location: string) {
  if (mode === "anonymous") {
    return "a source who asked not to be identified because of retaliation concerns";
  }
  if (mode === "role") {
    return `a records requester in ${location}`;
  }
  return "the person who provided the records for review";
}

export function StoryProtectionDemo() {
  const [issue, setIssue] = useState(SAMPLE.issue);
  const [location, setLocation] = useState(SAMPLE.location);
  const [actor, setActor] = useState(SAMPLE.actor);
  const [evidence, setEvidence] = useState(SAMPLE.evidence);
  const [mode, setMode] = useState<ProtectionMode>("anonymous");

  const preview = useMemo(() => {
    const safeIssue = clean(issue, SAMPLE.issue);
    const safeLocation = clean(location, "the local jurisdiction");
    const safeActor = clean(actor, "a public agency");
    const safeEvidence = clean(evidence, SAMPLE.evidence);
    const source = sourceLine(mode, safeLocation);

    return {
      headline: `${safeActor} faces records questions in ${safeLocation}`,
      dek: `A protected source says the paper trail shows a public-records problem. The next step is separating what is documented from what still needs to be verified.`,
      source,
      whatHappened: `According to ${source}, ${safeIssue}`,
      evidence: safeEvidence,
      missing:
        "The next records to request would be the full response log, internal routing notes, written denial language, and any policy the agency relied on.",
      why:
        "This matters because public records only work when ordinary people can follow the timeline, see the documents, and understand what the agency did or did not explain.",
    };
  }, [actor, evidence, issue, location, mode]);

  return (
    <section
      id="article-demo"
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-lg sm:p-6"
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
            Live demo
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold leading-tight tracking-normal">
            See how a tip becomes a protected article.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Type rough facts. This demo stays in your browser and does not save
            or send what you type. It shows the method: organize the record,
            protect the source, and ask for the missing documents.
          </p>

          <div className="mt-5 space-y-4">
            <Field
              label="What happened?"
              value={issue}
              onChange={setIssue}
              rows={4}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Where?"
                value={location}
                onChange={setLocation}
              />
              <Field
                label="Who or what agency?"
                value={actor}
                onChange={setActor}
              />
            </div>
            <Field
              label="What evidence exists?"
              value={evidence}
              onChange={setEvidence}
              rows={3}
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-bold text-[var(--color-ink)]">
              Identity protection
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {modes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  aria-pressed={mode === m.value}
                  className={[
                    "rounded-lg border px-3 py-3 text-left transition",
                    mode === m.value
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                      : "border-[var(--color-line)] bg-[var(--color-paper)] hover:border-[var(--color-accent)]",
                  ].join(" ")}
                >
                  <span className="block text-sm font-bold text-[var(--color-ink)]">
                    {m.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--color-muted)]">
                    {m.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
          <div className="border-b border-[var(--color-line)] pb-3">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              Article preview
            </p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight tracking-normal">
              {preview.headline}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {preview.dek}
            </p>
          </div>

          <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            <PreviewBlock title="Protected source line">
              {preview.source}
            </PreviewBlock>
            <PreviewBlock title="What happened">
              {preview.whatHappened}
            </PreviewBlock>
            <PreviewBlock title="What evidence exists">
              {preview.evidence}
            </PreviewBlock>
            <PreviewBlock title="What is still missing">
              {preview.missing}
            </PreviewBlock>
            <PreviewBlock title="Why it matters">
              {preview.why}
            </PreviewBlock>
          </div>

          <div className="mt-5 grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-xs leading-relaxed text-[var(--color-muted)] sm:grid-cols-2">
            <p>
              <strong className="text-[var(--color-ink)]">Concealed:</strong>{" "}
              name, contact info, employer, family details, private address,
              and details that identify the source unnecessarily.
            </p>
            <p>
              <strong className="text-[var(--color-ink)]">Preserved:</strong>{" "}
              dates, documents, public-records trail, agency actions, missing
              records, and the next request.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/case-review"
              className="btn-accent inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold"
            >
              Turn this into a review
            </a>
            <a
              href="/submit"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
            >
              Submit a tip
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const id = `story-demo-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const className =
    "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-[var(--color-accent)]";

  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-bold text-[var(--color-ink)]">
        {label}
      </span>
      {rows ? (
        <textarea
          id={id}
          value={value}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} resize-y`}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
    </label>
  );
}

function PreviewBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h4 className="font-display text-lg font-bold tracking-normal text-[var(--color-ink)]">
        {title}
      </h4>
      <p className="mt-1">{children}</p>
    </section>
  );
}
