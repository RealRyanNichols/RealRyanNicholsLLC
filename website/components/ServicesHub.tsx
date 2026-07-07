"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type ServiceSlug =
  | "strategy-call-30"
  | "site-audit"
  | "build-your-site"
  | "codebase-domain-bundle";

type Service = {
  slug: ServiceSlug;
  name: string;
  price: string;
  eyebrow: string;
  summary: string;
  bestFor: string;
  outcome: string;
  details: string[];
  proof: string;
};

const SERVICES: Service[] = [
  {
    slug: "strategy-call-30",
    name: "30-Minute Strategy Call",
    price: "$197",
    eyebrow: "Fast clarity",
    summary:
      "One focused call to decide what your story, site, offer, or public record needs next.",
    bestFor: "You know you need movement, but not what to build first.",
    outcome: "You leave with the next three moves in plain English.",
    details: [
      "Review the current site, story, audience, or public record.",
      "Identify the strongest first offer or attention hook.",
      "Turn scattered ideas into a short action list.",
    ],
    proof: "Smallest paid step",
  },
  {
    slug: "site-audit",
    name: "Site Audit",
    price: "$297",
    eyebrow: "Attention review",
    summary:
      "A written review of what is costing you clicks, trust, replies, sales, or shares.",
    bestFor: "You already have a site, feed, Substack, funnel, or offer.",
    outcome: "You get a fix list organized by attention, proof, trust, and money.",
    details: [
      "Homepage and first-click critique.",
      "Offer, CTA, trust signal, and copy review.",
      "Prioritized fixes a builder can execute.",
    ],
    proof: "Best before rebuild",
  },
  {
    slug: "build-your-site",
    name: "Build Your Site",
    price: "$997",
    eyebrow: "Owned platform",
    summary:
      "A domain-first site built around your posts, proof, services, support path, and contact flow.",
    bestFor: "You want your audience coming to your house, not only social media.",
    outcome: "You launch with a real homepage, feed, analytics, and conversion path.",
    details: [
      "Fast site structure around your actual work.",
      "Feed, service CTA, support/contact path, and basic analytics.",
      "30-day handoff so you can keep posting.",
    ],
    proof: "Core offer",
  },
  {
    slug: "codebase-domain-bundle",
    name: "Codebase + Domain Bundle",
    price: "$1,997",
    eyebrow: "Deeper build",
    summary:
      "A more complete owned-platform setup with domain guidance, launch copy, SEO basics, and follow-up.",
    bestFor: "You need the platform, message, and launch path handled together.",
    outcome: "You get the site, launch structure, and a 30-day post-launch check-in.",
    details: [
      "Website/feed, domain guidance, analytics, and SEO basics.",
      "Launch copy and offer framing.",
      "30-day post-launch check-in to tighten the system.",
    ],
    proof: "Highest leverage",
  },
];

const MODULES = [
  ["Public feed", "Posts, updates, essays, videos, and proof on your domain."],
  ["Service ladder", "A clear path from call to audit to build."],
  ["Tip or intake form", "Structured submissions without dumping chaos into your inbox."],
  ["Support path", "Subscribe, book, or buy without hunting."],
  ["Live pulse", "Visible momentum: people reading, sharing, or supporting."],
  ["Receipt wall", "Screenshots, files, source links, and timelines people can inspect."],
  ["Private follow-up", "A safer route for sensitive details that should not be public."],
  ["Admin surface", "A control room for posts, submissions, orders, and next actions."],
];

const PROBLEMS = [
  { value: "stuck", label: "I need clarity fast" },
  { value: "weak-site", label: "My site is not converting" },
  { value: "no-home", label: "I need my own platform" },
  { value: "serious-build", label: "I need a deeper build" },
] as const;

const PROOF_MODES = [
  { value: "story", label: "Story / creator" },
  { value: "business", label: "Business / services" },
  { value: "records", label: "Public record / investigation" },
  { value: "community", label: "Community / cause" },
] as const;

function recommend(problem: string, proofMode: string): Service {
  if (problem === "serious-build") return SERVICES[3];
  if (problem === "no-home") return SERVICES[2];
  if (problem === "weak-site") return SERVICES[1];
  if (proofMode === "records" && problem !== "stuck") return SERVICES[2];
  return SERVICES[0];
}

function serviceHref(slug: ServiceSlug) {
  return `/store/${slug}`;
}

function TrackerLink({
  service,
  label,
  className,
}: {
  service: Service;
  label: string;
  className: string;
}) {
  return (
    <Link
      href={serviceHref(service.slug)}
      className={className}
      onClick={() =>
        trackEvent("service_cta_click", {
          slug: service.slug,
          source: "services_hub",
        })
      }
    >
      {label}
    </Link>
  );
}

export function ServicesHub() {
  const [problem, setProblem] = useState<(typeof PROBLEMS)[number]["value"]>("stuck");
  const [proofMode, setProofMode] =
    useState<(typeof PROOF_MODES)[number]["value"]>("business");
  const [focus, setFocus] = useState<ServiceSlug>("strategy-call-30");

  const pick = useMemo(() => recommend(problem, proofMode), [problem, proofMode]);
  const focused = SERVICES.find((service) => service.slug === focus) ?? SERVICES[0];

  return (
    <article className="overflow-hidden">
      <section className="relative min-h-[auto] border-b border-[var(--color-line)] lg:min-h-[72vh]">
        <Image
          src="/social-cards/map-room.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#100805]/80" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 text-[#fdf8ea] sm:px-6 lg:min-h-[72vh] lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:py-10">
          <div className="pb-2">
            <p className="text-xs font-black uppercase tracking-normal text-[#f1c15f]">
              Business services built around attention, proof, and checkout
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.04] tracking-normal text-[#fdf8ea] sm:text-5xl lg:text-7xl">
              Turn attention into action.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#f6efdf] sm:text-lg">
              I build and sharpen owned websites for people who need their story,
              services, records, and audience on a domain they control. Social
              media gets attention. The website captures it.
            </p>
            <div className="rrn-tap-row mt-6">
              <a
                href="#story-path"
                className="rrn-tap btn-accent inline-flex rounded-lg px-5 py-3 text-sm font-bold"
              >
                See the proof path
              </a>
              <Link
                href="/tell-your-story"
                className="rrn-tap inline-flex rounded-lg border border-[#d8c89e] bg-[#fdf8ea] px-5 py-3 text-sm font-bold text-[#142a52] transition hover:border-[#fdf8ea]"
              >
                Try story flow
              </Link>
            </div>
          </div>

          <div
            id="story-path"
            className="rounded-lg border border-[#d8c89e]/50 bg-[#fdf8ea] p-4 text-[var(--color-ink)] shadow-2xl sm:p-5"
          >
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Proof you can click
            </p>
            <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal">
              You&apos;re standing inside the demo.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              This whole site — the feed, the searchable case archive, the live
              traffic map, the capture, the chat you can talk to out loud — is the
              exact system I build. Not a template. A domain I own that can&apos;t
              be throttled off. I build that for you.
            </p>
            <div className="mt-4 grid gap-2">
              {[
                ["Marine, builder, journalist", "Wholesale Universe founder. I build owned platforms, record systems, and lead engines that turn attention into action."],
                ["I built this from the ground up", "1,000+ documents, a live evidence archive, AI chat, data capture — proof of what the same system does for a business."],
                ["Own it, don't rent it", "Stop begging the algorithm. Your story, your list, your record, on a domain nobody can take."],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="grid grid-cols-[1.5rem_1fr] gap-3 rounded-lg border border-[var(--color-line)] bg-white p-3"
                >
                  <span className="mt-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--color-accent)]" aria-hidden />
                  <span>
                    <strong className="block text-base font-black text-[var(--color-ink)]">
                      {title}
                    </strong>
                    <span className="mt-1 block text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      {body}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className="rrn-tap-row mt-4">
              <a
                href="#service-match"
                className="rrn-tap inline-flex rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-black text-[var(--color-accent)]"
              >
                See what I build
              </a>
              <Link
                href="/#talk"
                className="rrn-tap inline-flex rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-black text-[var(--color-ink)]"
              >
                Talk to Ryan — tap the mic
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            ["Attention", "People see the thing fast."],
            ["Proof", "Receipts back up the claim."],
            ["Path", "The next click is obvious."],
            ["Money", "Checkout is not buried."],
          ].map(([title, body]) => (
            <div
              key={title}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
            >
              <p className="text-sm font-black text-[var(--color-ink)]">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="service-match" className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Pick the smallest smart move
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal">
              What do you need right now?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Once the story is clear, the service should be obvious. This
              matcher keeps people from overbuying or guessing.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.1fr]">
            <label className="block">
              <span className="text-xs font-bold uppercase text-[var(--color-muted)]">
                Main pressure
              </span>
              <select
                value={problem}
                onChange={(event) => {
                  setProblem(event.target.value as typeof problem);
                  trackEvent("services_matcher_change", {
                    field: "problem",
                    value: event.target.value,
                  });
                }}
                className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-3 text-sm"
              >
                {PROBLEMS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-[var(--color-muted)]">
                Proof type
              </span>
              <select
                value={proofMode}
                onChange={(event) => {
                  setProofMode(event.target.value as typeof proofMode);
                  trackEvent("services_matcher_change", {
                    field: "proof_mode",
                    value: event.target.value,
                  });
                }}
                className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-3 text-sm"
              >
                {PROOF_MODES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-[var(--color-line)] bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--color-blue)]">
                    Recommended
                  </p>
                  <h3 className="mt-1 text-xl font-black tracking-normal">
                    {pick.name}
                  </h3>
                </div>
                <p className="text-xl font-black text-[var(--color-accent)]">
                  {pick.price}
                </p>
              </div>
              <TrackerLink
                service={pick}
                label={`Open ${pick.name}`}
                className="btn-accent mt-3 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8 lg:py-10">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Services
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-normal lg:text-5xl">
              Start with the work that creates the next click.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              The page, offer, and proof have to work together. A stranger should
              understand what you do, why it matters, what proof exists, and what
              to do next without asking you to explain it twice.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {SERVICES.map((service) => (
              <button
                key={service.slug}
                type="button"
                onClick={() => {
                  setFocus(service.slug);
                  trackEvent("service_card_focus", {
                    slug: service.slug,
                    source: "services_hub",
                  });
                }}
                className={[
                  "min-h-36 rounded-lg border bg-[var(--color-paper)] p-4 text-left transition",
                  focused.slug === service.slug
                    ? "border-[var(--color-accent)] shadow-xl"
                    : "border-[var(--color-line)] hover:border-[var(--color-accent)]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-normal text-[var(--color-blue)]">
                    {service.eyebrow}
                  </p>
                  <p className="text-lg font-black text-[var(--color-accent)]">
                    {service.price}
                  </p>
                </div>
                <h3 className="mt-2 text-2xl font-black tracking-normal">
                  {service.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {service.summary}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
                  Selected service
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-normal">
                  {focused.name}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {focused.bestFor}
                </p>
              </div>
              <p className="text-4xl font-black text-[var(--color-accent)]">
                {focused.price}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              {focused.details.map((detail) => (
                <div
                  key={detail}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4"
                >
                  <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2 text-xs font-black uppercase tracking-normal text-[var(--color-blue)]">
                {focused.proof}
              </p>
              <TrackerLink
                service={focused}
                label={`Open checkout page - ${focused.price}`}
                className="rrn-tap btn-accent inline-flex rounded-lg px-5 py-3 text-sm font-bold"
              />
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-blue)] p-5 text-[#fdf8ea] sm:p-6">
            <p className="text-xs font-black uppercase tracking-normal text-[#d8c89e]">
              Attention mechanisms
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-normal text-[#fdf8ea]">
              Keep visitors moving.
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#f6efdf]">
              <li className="border-l-2 border-[#d8c89e] pl-3">
                <strong className="text-white">Matcher:</strong> reduces indecision
                by telling people the smallest smart service.
              </li>
              <li className="border-l-2 border-[#d8c89e] pl-3">
                <strong className="text-white">Proof modules:</strong> show what
                can live on the site before a buyer has to imagine it.
              </li>
              <li className="border-l-2 border-[#d8c89e] pl-3">
                <strong className="text-white">Checkout path:</strong> every
                serious service points to the existing Stripe-backed store.
              </li>
              <li className="border-l-2 border-[#d8c89e] pl-3">
                <strong className="text-white">Owned audience frame:</strong>{" "}
                social media becomes the billboard; the domain becomes the home.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-ink)] text-[#fdf8ea]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-normal text-[#d8c89e]">
              Build menu
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-normal text-[#fdf8ea] lg:text-5xl">
              The site can become the tool, not just the brochure.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#f6efdf]">
              The best websites give people something to touch: a live counter, a
              file wall, a tip form, a booking path, a feed, a support meter, or a
              private follow-up route. That is what keeps attention on your domain.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map(([title, body]) => (
              <div
                key={title}
                className="rounded-lg border border-[#d8c89e]/40 bg-white/[0.06] p-4"
              >
                <h3 className="font-sans text-base font-black text-[#fdf8ea]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#f6efdf]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Guardrails
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-normal sm:text-4xl">
              Strong copy. Clean claims.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              If a site handles public records, sensitive stories, misconduct
              claims, business promises, or audience money, it needs clear
              labels and safer language. Attention only helps if the record can
              stand up after people inspect it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["No fake urgency", "Use real deadlines, real capacity, and real offers."],
              ["No invented proof", "Do not manufacture receipts, metrics, or outcomes."],
              ["No legal advice claims", "Keep legal, investigative, and advocacy work separated."],
              ["No trapped customers", "Flat fee, clear next step, obvious way to contact Ryan."],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
              >
                <h3 className="font-sans text-base font-black">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-normal">
              Want the fastest useful move?
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              Start with a call if you need direction. Start with the audit if
              the current site is already live. Start with the build if you know
              the domain needs to become home base.
            </p>
          </div>
          <TrackerLink
            service={pick}
            label={`Start with ${pick.name}`}
            className="rrn-tap btn-accent inline-flex rounded-lg px-5 py-3 text-sm font-bold"
          />
        </div>
      </section>
    </article>
  );
}
