import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { CaseBriefingForm } from "@/components/CaseBriefingForm";
import { ShareRail } from "@/components/ShareRail";

export const dynamic = "force-dynamic";

const TITLE = "AI Case Briefings — ask the J6 archive";
const DESCRIPTION =
  "Pick a defendant or a co-defendant cluster, ask a question. The briefing is generated fresh from the structured archive, grounded only in what's actually on file.";

export const metadata: Metadata = {
  title: "AI Case Briefings",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/case/briefing` },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE.url}/case/briefing`,
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function CaseBriefingPage() {
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#e1bd5b] font-bold">
          The Briefing Desk · realryannichols.com
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] font-display">
          Ask the J6 archive.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
          Pick a defendant or a co-defendant cluster. Ask a question.
          The briefing is generated fresh from the structured archive,
          grounded only in what&apos;s actually on file. No invented
          facts. No training-data hallucinations. If a field isn&apos;t in
          the public record, it says so.
        </p>
      </header>

      {aiEnabled ? (
        <CaseBriefingForm />
      ) : (
        <section className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            Status
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
            Coming soon — needs an LLM API key.
          </h2>
          <div className="prose-body mt-3 text-sm sm:text-base">
            <p>
              The briefing pipeline is wired and ready: pick an entity →
              the server pulls every related row (co-defendants, docs,
              disposition history, salvage record) → it asks Claude to
              produce a tight 3-section briefing using <em>only</em> that
              data. The system prompt forbids any claim that isn&apos;t
              in the structured input, so the model can&apos;t make up a
              charge, a date, or a sentence.
            </p>
            <p>
              To turn this on, set <code>ANTHROPIC_API_KEY</code> in the
              Vercel environment for this project. The route is
              throttled (one request per IP per 10 seconds) and the
              answers are cached for 15 minutes, so the bill stays
              small.
            </p>
            <p>
              Until then, the same data is browsable on{" "}
              <Link
                href="/case/nexus"
                className="text-[var(--color-accent)] underline underline-offset-4"
              >
                the Case Nexus
              </Link>
              ,{" "}
              <Link
                href="/case/timeline"
                className="text-[var(--color-accent)] underline underline-offset-4"
              >
                the Timeline
              </Link>
              , and{" "}
              <Link
                href="/case/geography"
                className="text-[var(--color-accent)] underline underline-offset-4"
              >
                the Geography
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      <div className="mt-6">
        <ShareRail
          url={`${SITE.url}/case/briefing`}
          title="The J6 case briefing desk — ask the archive, get grounded answers: realryannichols.com/case/briefing"
        />
      </div>

      <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CrossLink
          href="/case/nexus"
          title="The Case Nexus"
          sub="Force-directed graph of co-defendant clusters."
        />
        <CrossLink
          href="/case/timeline"
          title="The Sentencing Wave"
          sub="Month-by-month chronology of arrests + sentencings."
        />
        <CrossLink
          href="/case/geography"
          title="The Geography"
          sub="Choropleth of every J6 defendant by home state."
        />
      </section>
    </article>
  );
}

function CrossLink({
  href,
  title,
  sub,
}: {
  href: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition group"
    >
      <p className="text-sm font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {title}
      </p>
      <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">
        {sub}
      </p>
    </Link>
  );
}
