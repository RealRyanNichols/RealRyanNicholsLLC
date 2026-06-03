import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuidedHelpDesk } from "@/components/GuidedHelpDesk";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Case Review Intake",
  description:
    "Use the guided private intake to organize facts, evidence, questions, privacy needs, and next steps before asking Ryan to review the record.",
  alternates: { canonical: `${SITE.url}/case-review` },
};

const routes = [
  {
    title: "Free first answer",
    body: "Use the guided assistant to get the first structure: what happened, what proves it, what is missing, and what needs protection.",
    href: "#guided-assistant",
    cta: "Start the guided intake",
  },
  {
    title: "Send a public tip",
    body: "If your goal is to submit a lead, source, public record, or corruption tip for review, use the tip line.",
    href: "/submit",
    cta: "Submit a tip",
  },
  {
    title: "Book paid help",
    body: "If you want Ryan to spend focused time helping organize the record, book the strategy call.",
    href: "/store/strategy-call-30",
    cta: "Book strategy call",
  },
];

const boundaries = [
  "Ryan is not a lawyer and Real Ryan Nichols LLC is not a law firm.",
  "This is evidence organization, public-records thinking, issue spotting, story structure, and plain-English next-step help.",
  "Do not send emergency requests here. Call emergency services if someone is in immediate danger.",
  "Do not send sealed records, minors' private information, SSNs, bank data, or medical records through this form.",
];

export default function CaseReviewPage() {
  return (
    <article className="rrn-page">
      <section className="rrn-hero">
        <Image
          src="/social-cards/map-room.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.2]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-paper)_0%,rgba(246,239,223,0.96)_44%,rgba(246,239,223,0.8)_100%)]" />
        <div className="rrn-hero-inner grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Case review intake
            </p>
            <h1 className="rrn-hero-title mt-3 max-w-3xl">
              Get the facts into a form people can follow.
            </h1>
            <p className="rrn-lead mt-4 max-w-2xl">
              You may not need a long phone call first. Start by giving the
              system the facts, the fear, the proof, and the privacy boundary.
              It will give you a first answer and save the context for Ryan.
            </p>
            <div className="rrn-tap-row mt-6">
              <Link
                href="#guided-assistant"
                className="rrn-tap btn-accent inline-flex rounded-lg px-5 py-3 text-sm font-black"
              >
                Start guided intake
              </Link>
              <Link
                href="/store/strategy-call-30"
                className="rrn-tap inline-flex rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-sm font-black text-[var(--color-ink)]"
              >
                Book paid review
              </Link>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
              The goal is transparency without chaos: a clearer timeline, a
              cleaner evidence list, and a safer next move.
            </p>
          </div>

          <GuidedHelpDesk source="case-review-page" />
        </div>
      </section>

      <section className="rrn-section">
        <div className="grid gap-4 lg:grid-cols-3">
          {routes.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rrn-card group block min-h-36 p-4 transition hover:border-[var(--color-accent)] sm:p-5"
            >
              <h2 className="font-display text-2xl font-black tracking-normal group-hover:text-[var(--color-accent)]">
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
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="rrn-section grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Response boundaries
            </p>
            <h2 className="rrn-section-title mt-2">
              People deserve answers. You still need boundaries.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
              This page gives visitors a place to explain their fear, get a
              useful first answer, and leave organized context. It does not
              turn Ryan into someone&apos;s always-on personal hotline.
            </p>
          </div>
          <div className="grid gap-3">
            {boundaries.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4 text-sm font-medium leading-relaxed text-[var(--color-ink-soft)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
