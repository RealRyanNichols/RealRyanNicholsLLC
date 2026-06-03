import type { Metadata } from "next";
import Link from "next/link";
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
    title: "Sensitive records or evidence",
    body: "You have documents, screenshots, links, reports, filings, or a timeline that should not be dropped into public comments.",
  },
  {
    title: "Source protection",
    body: "You want Ryan to understand the issue without exposing your name, employer, family, address, or other identifying details.",
  },
  {
    title: "Private follow-up",
    body: "You submitted a tip, watched a live, read a case file, or need Ryan to know something before it becomes public.",
  },
];

const reminders = [
  "Do not send emergency requests here. Call 911 or local emergency services.",
  "Do not send sealed records, minors' private information, SSNs, bank data, or medical records unless Ryan specifically asks for them through a safer channel.",
  "Real Ryan Nichols LLC is not a law firm. This is not legal advice or legal representation.",
];

export default function ContactPage() {
  return (
    <article className="bg-[var(--color-paper)]">
      <section className="border-b border-[var(--color-line)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:py-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              Private contact
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight tracking-normal text-[var(--color-ink)] sm:text-5xl">
              Send Ryan a private message.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
              Use this page when the facts matter, but the details should not
              be posted publicly. Ryan can review the message, decide what
              belongs in the record, and keep source-identifying details out of
              the public lane.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/submit"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--color-accent)] px-5 py-3 text-sm font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Submit a tip instead
              </Link>
              <Link
                href="/store#article-demo"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--color-blue)] px-5 py-3 text-sm font-bold text-[var(--color-blue)] transition hover:bg-[var(--color-blue-soft)]"
              >
                See protected article demo
              </Link>
            </div>
          </div>

          <PrivateMessageBox
            title="Write the private message"
            description="This sends directly into Ryan's private admin inbox. Leave contact info only if Ryan can follow up. The message is not published."
            source="contact-page"
            defaultOpen
            showToggle={false}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {useCases.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
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
    </article>
  );
}
