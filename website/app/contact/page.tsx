import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuidedHelpDesk } from "@/components/GuidedHelpDesk";
import { PrivateMessageBox } from "@/components/PrivateMessageBox";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Ryan Privately",
  description:
    "Send Ryan Nichols a private message about records, evidence, case organization, public corruption, tips, or sensitive follow-up.",
  alternates: { canonical: `${SITE.url}/contact` },
};

const useCases = [
  {
    title: "Send a private lead",
    body: "You know something important, but names, contact details, employers, family information, or source identity should stay out of public comments.",
  },
  {
    title: "Ask Ryan to look closer",
    body: "You have filings, screenshots, videos, agency names, dates, or a messy timeline and need Ryan to see what is really there.",
  },
  {
    title: "Keep the public version safer",
    body: "Ryan can separate what proves the issue from what could expose you, a witness, a child, or someone who is not part of the public record.",
  },
];

const reminders = [
  "Do not send emergency requests here. Call 911 or local emergency services.",
  "Do not send sealed records, minors' private information, SSNs, bank data, or medical records unless Ryan specifically asks for them through a safer channel.",
  "Real Ryan Nichols LLC is not a law firm. This is not legal advice or legal representation.",
];

const whatToSend = [
  "A short version of what happened, in plain English.",
  "Names of agencies, officials, companies, courts, or people involved.",
  "Dates, locations, case numbers, report numbers, links, or docket references.",
  "What evidence exists: screenshots, videos, filings, emails, texts, records, or witnesses.",
  "What you need protected: name, employer, family details, address, phone, role, or source identity.",
  "What Ryan should do next: verify, ask a question, review records, draft a public-records request, or prepare a safer article angle.",
];

const process = [
  {
    title: "1. You send the private version",
    body: "Give Ryan enough detail to understand the issue without posting it in the open.",
  },
  {
    title: "2. Ryan reviews the record",
    body: "The message goes into the private admin inbox, where it can be sorted, followed up on, or connected to a tip or case file.",
  },
  {
    title: "3. Public work stays evidence-first",
    body: "If something becomes public later, the useful record can be separated from private identifying details.",
  },
];

const routeCards = [
  {
    title: "Have a public tip?",
    body: "Use the tip form when the main goal is to send a lead, document, or source for review.",
    href: "/submit",
    cta: "Submit a tip",
  },
  {
    title: "Need case help?",
    body: "Use case review when you want paid help organizing documents, issues, evidence, and next steps.",
    href: "/case-review",
    cta: "Start case review",
  },
  {
    title: "Want the article demo?",
    body: "See how private facts can become a safer public article without exposing source identity.",
    href: "/store#article-demo",
    cta: "View demo",
  },
];

export default function ContactPage() {
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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-paper)_0%,rgba(246,239,223,0.96)_44%,rgba(246,239,223,0.78)_100%)]" />
        <div className="rrn-hero-inner grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-8">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              Real Ryan Nichols LLC / Private contact
            </p>
            <h1 className="rrn-hero-title mt-3 max-w-3xl">
              Tell Ryan what happened without putting it in public.
            </h1>
            <p className="rrn-lead mt-4 max-w-2xl">
              Use this page when the facts matter, but the details should not be
              posted in a comment thread. Send the private version here so Ryan
              can understand the record, protect source-identifying details, and
              decide what belongs in a safer public lane.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["Private inbox", "Source protection", "No public posting"].map(
                (item) => (
                  <div
                    key={item}
                    className="border-l-4 border-[var(--color-accent)] bg-[var(--color-surface)] px-3 py-2 shadow-sm"
                  >
                    <p className="text-sm font-bold text-[var(--color-ink)]">
                      {item}
                    </p>
                  </div>
                ),
              )}
            </div>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
              This is not emergency services, legal representation, or a
              guarantee that Ryan will publish or investigate. It is a private
              way to get serious information into the review queue.
            </p>
          </div>

          <GuidedHelpDesk source="contact-page" />
        </div>
      </section>

      <section className="rrn-section">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              When to use this page
            </p>
            <h2 className="rrn-section-title mt-2">
              Private first. Public only when the record is ready.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
              Some information should not start as a public post. A private
              message lets Ryan see the pattern, ask for missing details, and
              avoid exposing people who are not trying to become the story.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {useCases.map((item) => (
              <div
                key={item.title}
                className="rrn-card p-4"
              >
                <h3 className="font-display text-xl font-bold tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="rrn-section grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              What makes a useful private message
            </p>
            <h2 className="rrn-section-title mt-2">
              Give Ryan the facts, the proof, and what needs to stay hidden.
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {whatToSend.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm font-medium leading-relaxed text-[var(--color-ink-soft)] sm:p-4"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-blue)]">
              Example
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-normal">
              Better than a vague call request.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              I worked around the agency in 2024. I do not want my name used.
              The issue involves missing bodycam, a changed report date, and a
              witness who was never listed. I have screenshots, the report
              number, and the hearing date. Ryan can email me for verification.
            </p>
            <div className="mt-5 rounded-lg border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
              <p className="text-sm font-bold text-[var(--color-ink)]">
                That gives Ryan a path: issue, timeframe, records, proof,
                missing piece, privacy boundary, and follow-up method.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rrn-section">
        <PrivateMessageBox
          title="Already know what you need to say?"
          description="Send a direct private message instead of using the guided assistant. This still goes into Ryan's private admin inbox and is not published."
          source="contact-page-direct"
          defaultOpen={false}
          showToggle
          expandedIntake
          submitLabel="Send direct private message"
          defaultSubject="Private contact"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {process.map((item) => (
            <div
              key={item.title}
              className="rrn-card p-4 sm:p-5"
            >
              <h2 className="font-display text-xl font-bold tracking-normal">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {routeCards.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rrn-card group block min-h-28 p-4 transition hover:border-[var(--color-accent)] sm:p-5"
            >
              <h2 className="font-display text-xl font-bold tracking-normal group-hover:text-[var(--color-accent)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {item.body}
              </p>
              <p className="mt-4 text-sm font-black text-[var(--color-accent)]">
                {item.cta} -&gt;
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
            Before you send
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {reminders.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-[var(--color-line)] bg-[var(--color-ink)] text-[var(--color-paper)]">
        <div className="rrn-section grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-line)]">
              Direct contact
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-normal text-[var(--color-paper)]">
              Prefer email or text?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-line-soft)]">
              The form is the cleanest private lane on the site. If you need a
              direct contact path, use Ryan&apos;s public business contact.
            </p>
          </div>
          <div className="rrn-tap-row">
            <a
              href="mailto:Ryan@RealRyanNichols.com"
              className="rrn-tap inline-flex rounded-lg border border-[var(--color-paper)] px-4 py-2 text-sm font-bold text-[var(--color-paper)] transition hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
            >
              Ryan@RealRyanNichols.com
            </a>
            <a
              href="tel:+19033458990"
              className="rrn-tap inline-flex rounded-lg border border-[var(--color-paper)] px-4 py-2 text-sm font-bold text-[var(--color-paper)] transition hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
            >
              Call/Text (903) 345-8990
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
