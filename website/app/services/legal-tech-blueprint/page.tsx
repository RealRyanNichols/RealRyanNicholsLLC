import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

const EMAIL = "Ryan@RealRyanNichols.com";
const mailto = (subject: string) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

export const metadata: Metadata = {
  title: "Build Your Own Legal-Tech Case Dashboard",
  description:
    "A private legal app blueprint for attorneys who want to organize case data, client intake, evidence, documents, timelines, and dashboards without being trapped inside social media, scattered files, or generic website builders.",
  alternates: { canonical: `${SITE.url}/services/legal-tech-blueprint` },
  openGraph: {
    title: "Build Your Own Legal-Tech Case Dashboard",
    description:
      "A custom legal-tech foundation for attorneys: public site, private dashboard, case database, intake, evidence, documents, and timelines. Three engagement options.",
    url: `${SITE.url}/services/legal-tech-blueprint`,
    type: "website",
  },
};

type Pkg = {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  blurb: string;
  includes: string[];
  ctaLabel: string;
  ctaSubject: string;
  recommended?: boolean;
};

const PACKAGES: Pkg[] = [
  {
    id: "diy-blueprint",
    name: "DIY Blueprint + Prompt Stack",
    price: "$2,500",
    priceNote: "one-time",
    blurb:
      "For someone who wants the roadmap, the tools, the setup instructions, and the prompts so they can build the first version themselves.",
    includes: [
      "Full legal-tech app roadmap",
      "Tool setup checklist",
      "Vercel, GitHub, Supabase overview",
      "Suggested database structure",
      "Page and dashboard structure",
      "Intake form structure",
      "Case data structure",
      "Prompt pack for Claude Code and Codex",
      "Deployment instructions",
      "One kickoff call",
      "One follow-up call",
      "7 days of basic clarification support",
    ],
    ctaLabel: "Start With the Blueprint",
    ctaSubject: "Legal-Tech Blueprint: DIY Blueprint + Prompt Stack",
  },
  {
    id: "guided-build",
    name: "Guided Build Sprint",
    price: "$5,000",
    priceNote: "one-time",
    blurb:
      "For someone who is not technologically savvy but wants to own the system and learn how it works while getting help through the first live version.",
    includes: [
      "Everything in the DIY Blueprint",
      "Guided setup of Vercel, GitHub, Supabase",
      "Help connecting the first project",
      "Help reviewing Claude Code and Codex output",
      "Help fixing the first round of errors",
      "2 to 3 working sessions",
      "First live deployment support",
      "14 days of follow-up support",
    ],
    ctaLabel: "Choose Guided Build",
    ctaSubject: "Legal-Tech Blueprint: Guided Build Sprint",
    recommended: true,
  },
  {
    id: "done-for-you",
    name: "Done-For-You MVP",
    price: "$9,500",
    priceNote: "starting price",
    blurb:
      "For someone who wants me to build the first working version and hand it over.",
    includes: [
      "Public site foundation",
      "Admin dashboard foundation",
      "Basic client and case dashboard",
      "Supabase database setup",
      "Intake structure",
      "Case profile structure",
      "Document and evidence structure",
      "Login system foundation",
      "Deployment on Vercel",
      "GitHub repo handoff",
      "Basic training and documentation",
      "30 days of bug fixes after launch",
    ],
    ctaLabel: "Request Done-For-You Build",
    ctaSubject: "Legal-Tech Blueprint: Done-For-You MVP",
  },
];

const SCATTERED = [
  "Emails, texts, PDFs, photos, voicemails, screenshots, pleadings, and notes usually live in different places.",
  "Clients do not know how to organize their own facts, evidence, timelines, and documents.",
  "Attorneys waste time digging through disorganized information before they can even understand the case.",
  "A legal-tech dashboard gives the firm a repeatable system for intake, organization, review, and presentation.",
];

const STACK: { name: string; tag?: string; body: string }[] = [
  { name: "Vercel", body: "Deploy the app fast with modern hosting." },
  { name: "GitHub", body: "Own the codebase and version history." },
  {
    name: "Supabase",
    body: "Database, authentication, users, and file storage.",
  },
  {
    name: "Claude Code / Codex",
    body: "AI-assisted development for rapid building, debugging, and iteration.",
  },
  {
    name: "Stripe",
    tag: "Optional",
    body: "Payments, invoices, retainers, and client billing if needed.",
  },
  {
    name: "Client Dashboard",
    tag: "Optional",
    body: "Let clients log in, submit information, upload documents, and track case status.",
  },
];

const FAMILY_LAW = [
  "Client intake",
  "Case profiles",
  "Parties and contacts",
  "Children and custody issues",
  "Evidence",
  "Documents",
  "Timelines",
  "Notes",
  "Tasks",
  "Court dates",
  "Case status",
  "Client updates",
  "Public education content",
  "Private attorney dashboard",
  "Optional client login",
];

const ROADMAP = [
  "Public legal education site",
  "Blog or newsfeed",
  "Attorney admin dashboard",
  "Client intake forms",
  "Case dashboard",
  "Client dashboard",
  "Evidence upload system",
  "Document library",
  "Timeline builder",
  "Party and contact database",
  "Notes and task tracking",
  "Court date tracking",
  "Searchable case records",
  "AI-assisted summaries",
  "Payment or invoice links",
  "Secure login",
  "Analytics and lead tracking",
];

const GOOD_FIT = [
  "Attorneys who want to build a real legal-tech asset",
  "Family law firms that need better case intake and organization",
  "Lawyers who want to own their platform",
  "People who understand the value of dashboards, data, and repeatable workflows",
  "Serious professionals who want something deeper than a basic website",
];

const NOT_FIT = [
  "Someone looking for a $500 website",
  "Someone who wants every feature built overnight",
  "Someone who wants to upload confidential client data into AI tools before the system is properly structured",
  "Someone who does not want to learn or invest in the process",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is this a website or an app?",
    a: "It starts as a website, but the structure is closer to a custom legal-tech app. It can include public pages, private dashboards, database records, client intake, documents, and user accounts.",
  },
  {
    q: "Can this be used for family law?",
    a: "Yes. The structure can be adapted for custody, divorce, client intake, evidence organization, timelines, court dates, notes, documents, and case updates.",
  },
  {
    q: "Do I need to be technical?",
    a: "For the DIY option, yes, at least somewhat. For the guided option, I help walk you through the stack. For the done-for-you option, I build the first working version.",
  },
  {
    q: "Can I use AI with real client data?",
    a: "Not at the beginning. The foundation should be built first, and sensitive data should only be handled after confidentiality, consent, permissions, storage, and professional responsibility issues are considered.",
  },
  {
    q: "Can this take payments?",
    a: "Yes, Stripe can be added if needed for payments, invoices, retainers, or subscriptions.",
  },
  {
    q: "Will I own the system?",
    a: "The goal is for you to own your stack: your GitHub repo, your Vercel deployment, your Supabase database, and your app foundation.",
  },
  {
    q: "How fast can this be launched?",
    a: "A basic first version can usually move quickly once the structure is decided, but the exact timeline depends on the features, data model, dashboard complexity, and how much polish is needed.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-blue)]">
      {children}
    </p>
  );
}

export default function LegalTechBlueprintPage() {
  return (
    <article className="rrn-page">
      {/* SECTION 1: Hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-blue)] text-[var(--color-paper)]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-gold)]">
            Real Ryan Nichols LLC / Legal-Tech Blueprint
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Build Your Own Legal-Tech Case Dashboard
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-[#e7ecf6] sm:text-xl">
            I built my own legal case platform to organize records, timelines,
            people, posts, evidence, filings, documents, and public case
            content. Now I can show you how to build something similar for family
            law, client intake, case review, and legal data organization.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={mailto("Legal-Tech Blueprint: Request the Blueprint")}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-7 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
            >
              Request the Blueprint
            </a>
            <a
              href="#packages"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-paper)]/40 bg-white/10 px-7 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-white/20"
            >
              View the Packages
            </a>
          </div>
          <p className="mt-6 max-w-2xl text-sm font-semibold text-[#c6d2e8]">
            For attorneys, legal professionals, case researchers, and serious
            operators who want more than a basic website.
          </p>
        </div>
      </section>

      {/* SECTION 2: What This Actually Is */}
      <section className="rrn-section">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>What this actually is</Eyebrow>
            <h2 className="rrn-section-title mt-2">This is not a normal website.</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-soft)]">
              A normal website gives people pages to read.
            </p>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
              This system gives you a working legal-tech foundation: a public
              site, a private dashboard, a database, intake flows, case records,
              document organization, and a structure that can grow into a real
              client-facing platform.
            </p>
          </div>
          <div className="rrn-card p-6">
            <p className="text-sm font-bold text-[var(--color-ink)]">
              For a family law practice, this can become the foundation for
              organizing:
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FAMILY_LAW.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm font-medium leading-relaxed text-[var(--color-ink-soft)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3: Why This Matters */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="rrn-section">
          <Eyebrow>Why this matters</Eyebrow>
          <h2 className="rrn-section-title mt-2">
            Most legal data is scattered everywhere.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {SCATTERED.map((body, i) => (
              <div key={body} className="rrn-card p-5">
                <p className="font-display text-lg font-black text-[var(--color-blue)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-base leading-relaxed text-[var(--color-ink-soft)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: The Build Stack */}
      <section className="rrn-section">
        <Eyebrow>The build stack</Eyebrow>
        <h2 className="rrn-section-title mt-2">The stack behind the system.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((tool) => (
            <div key={tool.name} className="rrn-card p-5">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                  {tool.name}
                </h3>
                {tool.tag ? (
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                    {tool.tag}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {tool.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: What We Can Build */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="rrn-section">
          <Eyebrow>What we can build</Eyebrow>
          <h2 className="rrn-section-title mt-2">
            What your family law version could include.
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ROADMAP.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3"
              >
                <span
                  aria-hidden
                  className="font-display text-lg font-black text-[var(--color-blue)]"
                >
                  +
                </span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {item}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border-l-4 border-[var(--color-gold)] bg-[var(--color-gold-soft)] p-4">
            <p className="text-sm font-bold leading-relaxed text-[var(--color-ink)]">
              This is the roadmap the system can grow into. Not every item is
              included in every package. We decide the scope together based on
              the engagement option you choose.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: Packages */}
      <section id="packages" className="rrn-section scroll-mt-24">
        <Eyebrow>Packages</Eyebrow>
        <h2 className="rrn-section-title mt-2">Three ways I can help.</h2>
        <div className="mt-7 grid gap-5 lg:grid-cols-3 lg:items-start">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              id={pkg.id}
              className={[
                "flex h-full flex-col rounded-2xl border bg-[var(--color-surface)] p-6 shadow-sm scroll-mt-24",
                pkg.recommended
                  ? "border-2 border-[var(--color-blue)] shadow-lg lg:-mt-2"
                  : "border-[var(--color-line)]",
              ].join(" ")}
            >
              {pkg.recommended ? (
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[var(--color-blue)] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[var(--color-paper)]">
                  Recommended
                </span>
              ) : null}
              <h3 className="font-display text-2xl font-black tracking-tight text-[var(--color-ink)]">
                {pkg.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-4xl font-black tabular-nums text-[var(--color-ink)]">
                  {pkg.price}
                </span>
                {pkg.priceNote ? (
                  <span className="text-sm font-bold text-[var(--color-muted)]">
                    {pkg.priceNote}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {pkg.blurb}
              </p>
              <ul className="mt-5 space-y-2">
                {pkg.includes.map((inc) => (
                  <li
                    key={inc}
                    className="flex items-start gap-2 text-sm font-medium leading-relaxed text-[var(--color-ink-soft)]"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 font-black text-[var(--color-success)]"
                    >
                      &#10003;
                    </span>
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
              {pkg.id === "done-for-you" ? (
                <p className="mt-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-xs font-bold text-[var(--color-ink-soft)]">
                  Payment terms: 50% upfront and 50% before final handoff.
                </p>
              ) : null}
              <a
                href={mailto(pkg.ctaSubject)}
                className={[
                  "mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-black transition",
                  pkg.recommended
                    ? "bg-[var(--color-accent)] text-[var(--color-paper)] hover:bg-[var(--color-accent-strong)]"
                    : "border border-[var(--color-blue)] text-[var(--color-blue)] hover:bg-[var(--color-blue)] hover:text-[var(--color-paper)]",
                ].join(" ")}
              >
                {pkg.ctaLabel}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: Ongoing Consulting */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="rrn-section grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Eyebrow>Ongoing consulting</Eyebrow>
            <h2 className="rrn-section-title mt-2">Ongoing help after launch.</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-soft)]">
              After the first build, I can stay available as a consultant when
              needed. This is for strategy, troubleshooting, prompt work, feature
              planning, AI-assisted development, dashboard improvements, and
              system expansion.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rrn-card p-5">
              <p className="font-display text-3xl font-black tabular-nums text-[var(--color-ink)]">
                $175
                <span className="text-base font-bold text-[var(--color-muted)]">
                  {" "}
                  / hour
                </span>
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink-soft)]">
                As needed, no retainer required.
              </p>
            </div>
            <div className="rrn-card p-5">
              <p className="font-display text-3xl font-black tabular-nums text-[var(--color-ink)]">
                $1,500
                <span className="text-base font-bold text-[var(--color-muted)]">
                  {" "}
                  / month
                </span>
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink-soft)]">
                Retainer for up to 10 hours per month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: Confidentiality and Client Data Warning */}
      <section className="rrn-section">
        <div className="rounded-2xl border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-6 sm:p-8">
          <Eyebrow>Important</Eyebrow>
          <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-[var(--color-ink)] sm:text-3xl">
            Important note about confidential client data.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-ink)]">
            Because this involves family law and sensitive client information, I
            would not start by dumping confidential client data into AI tools.
          </p>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
            The right approach is to build the foundation first, then decide how
            intake, storage, permissions, AI usage, and client data should be
            handled.
          </p>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
            This page is about building the technical system and workflow. It is
            not legal advice, and it does not replace a law firm&apos;s own
            duties around confidentiality, consent, security, and professional
            responsibility.
          </p>
        </div>
      </section>

      {/* SECTION 9: Best Fit */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="rrn-section">
          <Eyebrow>Best fit</Eyebrow>
          <h2 className="rrn-section-title mt-2">Who this is for.</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-success)]/40 bg-[var(--color-success-soft)] p-6">
              <h3 className="font-display text-xl font-black text-[var(--color-success)]">
                Good fit
              </h3>
              <ul className="mt-4 space-y-2">
                {GOOD_FIT.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm font-medium leading-relaxed text-[var(--color-ink)]"
                  >
                    <span aria-hidden className="mt-0.5 font-black text-[var(--color-success)]">
                      &#10003;
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-6">
              <h3 className="font-display text-xl font-black text-[var(--color-muted)]">
                Not a fit
              </h3>
              <ul className="mt-4 space-y-2">
                {NOT_FIT.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm font-medium leading-relaxed text-[var(--color-ink-soft)]"
                  >
                    <span aria-hidden className="mt-0.5 font-black text-[var(--color-muted)]">
                      &#215;
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: Final CTA */}
      <section className="bg-[var(--color-blue)] text-[var(--color-paper)]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-gold)]">
            My recommendation
          </p>
          <h2 className="mt-3 font-display text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            For most attorneys, the Guided Build Sprint is the best starting
            point.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-[#e7ecf6]">
            You get the blueprint, the prompts, the stack, the setup guidance,
            and enough help to get the first version live without being
            completely lost in the weeds.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={mailto("Legal-Tech Blueprint: Start With the Guided Build")}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-7 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
            >
              Start With the Guided Build
            </a>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-paper)]/40 bg-white/10 px-7 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-white/20"
            >
              Ask a Question First
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 11: FAQ */}
      <section className="rrn-section">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="rrn-section-title mt-2">Questions, answered straight.</h2>
        <div className="mt-6 divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4 sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[var(--color-ink)]">
                <span>{item.q}</span>
                <span
                  aria-hidden
                  className="shrink-0 text-xl font-black text-[var(--color-blue)] transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* SECTION 12: Footer Proposal Note */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Prepared by Ryan Nichols
          </p>
          <p className="mt-3 font-display text-2xl font-black tracking-tight text-[var(--color-ink)]">
            Let us build something you actually own.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={mailto("Legal-Tech Blueprint: Request the Blueprint")}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-7 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
            >
              Request the Blueprint
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="text-sm font-bold text-[var(--color-blue)] underline underline-offset-4"
            >
              {EMAIL}
            </a>
          </div>
          <p className="mt-8 text-base font-bold text-[var(--color-ink)]">-Ryan</p>
        </div>
      </section>
    </article>
  );
}
