import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StoryIntakeForm } from "@/components/StoryIntakeForm";
import { SITE } from "@/lib/site";

const TITLE = "Tell Your Story | Build the Pattern";
const DESCRIPTION =
  "Tell Ryan what happened in a structured private story form. Organize dates, people, agencies, proof, witnesses, missing records, and privacy boundaries.";

const steps = [
  {
    title: "Say what happened",
    body: "Type it, or just talk — tap the mic and speak it out loud. There is no wrong way to tell it, and no story too small.",
  },
  {
    title: "Choose how public",
    body: "Stay completely anonymous, or leave a way for Ryan to reach you. You set the boundary — nothing goes public on its own.",
  },
  {
    title: "Ryan takes it from here",
    body: "He reads every one himself, protects what needs to stay private, and looks for where your story connects to others.",
  },
];

const trustPoints = ["100% anonymous option", "Free — no account", "Ryan reads every one"];

const prompts = [
  "Police or jail",
  "Court or family court",
  "CPS or an agency",
  "Censorship",
  "Threats or retaliation",
  "Fraud or money",
  "Something else",
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

// Source-protection + submission policy shown before the form. DRAFT wording —
// final language subject to review.
const POLICY = [
  {
    title: "What can be published",
    body: "Only material backed by records, dates, witnesses, or documents — and only after review. Personal testimony is labeled as testimony; allegations are labeled as allegations.",
  },
  {
    title: "What stays private",
    body: "Your identity and contact details, anything you mark private, and sensitive data stay in the private review queue — they are not posted.",
  },
  {
    title: "How it's reviewed",
    body: "Ryan reads every submission himself, compares it against other leads, and decides what (if anything) is strong and safe enough to publish.",
  },
  {
    title: "No guarantee of publication",
    body: "Submitting puts your story in the private queue. It does not guarantee publication — most submissions strengthen the bigger pattern rather than becoming their own post.",
  },
  {
    title: "Not legal advice, not an emergency line",
    body: "This is not legal advice or representation, and not an emergency service. If someone is in immediate danger, call 911.",
  },
  {
    title: "Please don't send",
    body: "Sealed records, a minor's identifying details, SSNs or bank numbers, medical records, home addresses, or private third-party data you don't have the legal right to share.",
  },
  {
    title: "Anonymity — and its limits",
    body: "You can submit fully anonymously; if you do, there is no way to follow up with you. Even with contact info, your identity stays out of public work unless you explicitly agree to go on the record after verification.",
  },
  {
    title: "Fix it or take it down",
    body: "Submitted something by mistake, or want a correction or removal? Use private contact and it will be handled.",
  },
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
    images: [`${SITE.url}/og/site`],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE.url}/og/site`],
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Tell Your Story
            </p>
            <h1 className="rrn-hero-title mt-3 max-w-3xl">
              Something happen to you that wasn&apos;t right? Tell it here.
            </h1>
            <p className="rrn-lead mt-4 max-w-2xl">
              In your own words — anonymously if you want. No account, no cost.
              Ryan reads every single one himself, and your story might be the
              one that connects the dots for someone else going through the same
              thing.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {trustPoints.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-black text-[var(--color-ink)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  {item}
                </span>
              ))}
            </div>
            <div className="rrn-tap-row mt-6">
              <a
                href="#story-form"
                className="rrn-tap rounded-lg bg-[var(--color-accent)] px-5 py-3 text-sm font-black text-white"
              >
                Tell it now
              </a>
              <a
                href="#story-form"
                className="rrn-tap rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-sm font-black text-[var(--color-ink)]"
              >
                🎙 Prefer to talk? Record it
              </a>
            </div>
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                What is it about?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {prompts.map((item) => (
                  <a
                    key={item}
                    href="#story-form"
                    className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-blue)] bg-[var(--color-blue-strong)] p-5 text-[var(--color-paper)] shadow-xl sm:p-6">
            <p className="text-xs font-black uppercase tracking-normal text-[#e1bd5b]">
              How it works — 3 steps
            </p>
            <div className="mt-4 grid gap-3">
              {steps.map((item, index) => (
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

      <section className="rrn-section">
        <div className="rrn-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Before you submit — how this works
          </p>
          <h2 className="rrn-section-title mt-2">
            Your protection, in plain English.
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {POLICY.map((p) => (
              <PolicyBlock key={p.title} title={p.title} body={p.body} />
            ))}
          </div>
          <p className="mt-4 text-sm">
            <Link
              href="/editorial-standards"
              className="font-bold text-[var(--color-accent)] hover:underline"
            >
              Read the full editorial standards →
            </Link>
          </p>
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

function PolicyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <p className="text-sm font-black text-[var(--color-ink)]">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        {body}
      </p>
    </div>
  );
}
