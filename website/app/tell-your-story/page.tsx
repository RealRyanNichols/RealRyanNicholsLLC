import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StoryIntakeForm } from "@/components/StoryIntakeForm";
import { SITE } from "@/lib/site";

const TITLE = "Tell Your Story | Build the Pattern";
const DESCRIPTION =
  "Tell Ryan what happened in a structured private story form. Organize dates, people, agencies, proof, witnesses, missing records, and privacy boundaries.";

const storyLoops = [
  {
    title: "One story",
    body: "You explain what happened in plain English: dates, place, people, agency, court, company, and the first proof.",
  },
  {
    title: "One pattern",
    body: "Ryan can compare the story against other submissions by agency, official, date range, missing record, witness, and issue.",
  },
  {
    title: "One clearer record",
    body: "The public version can separate facts from claims and hide source-identifying details until they are safe to use.",
  },
];

const formLanes = [
  {
    title: "Tell your story",
    body: "Use the full story form when the context matters and you want Ryan to see the pattern.",
    href: "#story-form",
    cta: "Start the story form",
  },
  {
    title: "Send a hard tip",
    body: "Use the tip line for one lead, one document, one court link, one video, or one missing record.",
    href: "/submit",
    cta: "Submit a tip",
  },
  {
    title: "Contact privately",
    body: "Use private contact for a sensitive message, source-protection concern, or follow-up detail.",
    href: "/contact",
    cta: "Private contact",
  },
];

const rules = [
  "Do not send emergency requests here. Call emergency services if someone is in immediate danger.",
  "Do not send sealed records, minors' private information, SSNs, bank data, or medical records unless Ryan asks through a safer channel.",
  "Real Ryan Nichols LLC is not a law firm and does not provide legal representation.",
  "Submissions are private review leads. They are not automatically published.",
  "Public claims must be backed by records, dates, witnesses, documents, or other verifiable proof.",
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/tell-your-story` },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE.url}/tell-your-story`,
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function TellYourStoryPage() {
  return (
    <article className="rrn-page">
      <section className="rrn-hero">
        <Image
          src="/uploads/record-they-cant-bury-og-thumbnail.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.16]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-paper)_0%,rgba(247,243,235,0.95)_42%,rgba(247,243,235,0.76)_100%)]" />

        <div className="rrn-hero-inner grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              Real Ryan Nichols LLC / Story web
            </p>
            <h1 className="rrn-hero-title mt-3 max-w-3xl">
              Tell your story so it can connect to the bigger pattern.
            </h1>
            <p className="rrn-lead mt-4 max-w-2xl">
              People do not just want a form. They want a place to say what
              happened, protect what needs to stay private, and see how one
              story can connect to the next. This is where the record starts.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["Dates", "Proof", "Witness links"].map((item) => (
                <div
                  key={item}
                  className="border-l-4 border-[var(--color-accent)] bg-[var(--color-surface)] px-3 py-2 shadow-sm"
                >
                  <p className="text-sm font-bold text-[var(--color-ink)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <div className="rrn-tap-row mt-6">
              <a
                href="#story-form"
                className="rrn-tap rounded-lg bg-[var(--color-accent)] px-5 py-3 text-sm font-black text-white"
              >
                Start telling it
              </a>
              <Link
                href="/the-map-room"
                className="rrn-tap rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-sm font-black text-[var(--color-ink)]"
              >
                See the map room
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-blue)] bg-[var(--color-blue-strong)] p-5 text-[var(--color-paper)] shadow-xl sm:p-6">
            <p className="text-xs font-black uppercase tracking-normal text-[#e1bd5b]">
              How the story web works
            </p>
            <div className="mt-4 grid gap-3">
              {storyLoops.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-white/20 bg-white/[0.07] p-4"
                >
                  <p className="text-xs font-black uppercase tracking-normal text-white/55">
                    Step {index + 1}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-black tracking-normal text-[var(--color-paper)]">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rrn-section">
        <div className="grid gap-4 lg:grid-cols-3">
          {formLanes.map((lane) => (
            <Link
              key={lane.title}
              href={lane.href}
              className="rrn-card group block p-4 transition hover:border-[var(--color-accent)] sm:p-5"
            >
              <h2 className="font-display text-2xl font-black tracking-normal group-hover:text-[var(--color-accent)]">
                {lane.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {lane.body}
              </p>
              <p className="mt-4 text-sm font-black text-[var(--color-accent)]">
                {lane.cta} -&gt;
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="story-form"
        className="border-y border-[var(--color-line)] bg-[var(--color-paper)]"
      >
        <div className="rrn-section">
          <StoryIntakeForm />
        </div>
      </section>

      <section className="rrn-section">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              The hook is clarity
            </p>
            <h2 className="rrn-section-title mt-2">
              People stay when the record starts making sense.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
              The point is not to trap people on the site. The point is to give
              them a place where their fear, documents, screenshots, timelines,
              and witnesses become understandable. When they can see the pattern,
              they come back with better records.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Story profile",
                "Pattern tags",
                "Witness links",
                "Missing records",
                "Safer public angle",
                "Private follow-up path",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-sm font-black text-[var(--color-ink)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-blue)]">
              Boundaries
            </p>
            <h2 className="mt-2 font-display text-2xl font-black tracking-normal">
              Strong does not mean reckless.
            </h2>
            <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {rules.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </article>
  );
}
