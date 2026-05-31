import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Own Your Feed",
  description:
    "Get a domain-first personal feed that you control: no algorithm dependency, no social platform lock-in, and a clear path to paid support.",
  alternates: { canonical: `${SITE.url}/own-your-feed` },
  openGraph: {
    title: "Own Your Feed",
    description:
      "Ryan Nichols builds domain-first feeds and public record sites for people who need to stop renting attention from social media.",
    images: ["/social-cards/map-room.jpg"],
  },
};

const offers = [
  {
    name: "30-Minute Strategy Call",
    price: "$197",
    href: "/store/strategy-call-30",
    summary: "One focused call to pick the next three moves.",
    details: [
      "Review your story, audience, site, or feed.",
      "Find the fastest money path.",
      "Leave with a short action list.",
    ],
  },
  {
    name: "Site Audit",
    price: "$297",
    href: "/store/site-audit",
    summary: "A written attention and conversion review.",
    details: [
      "Audit your homepage, feed, offers, and trust signals.",
      "Flag what is confusing, weak, or costing you clicks.",
      "Give you fixes you can hand to any builder.",
    ],
  },
  {
    name: "Build Your Site",
    price: "$997",
    href: "/store/build-your-site",
    summary: "Your owned feed, launched on your domain.",
    details: [
      "Domain-first publishing surface.",
      "Basic analytics and contact/support path.",
      "30-day handoff so you can keep posting.",
    ],
  },
  {
    name: "Codebase + Domain Bundle",
    price: "$1,997",
    href: "/store/codebase-domain-bundle",
    summary: "A deeper platform build with launch support.",
    details: [
      "Feed, pages, SEO basics, analytics, and launch copy.",
      "Built around your message, proof, and offer.",
      "Includes a 30-day post-launch check-in.",
    ],
  },
];

const layers = [
  {
    label: "Attention",
    title: "Stop sending your best people away.",
    body:
      "Every post should pull people back to a domain you own, where the next click can become a message, a purchase, a tip, or a supporter.",
  },
  {
    label: "Proof",
    title: "Receipts beat vibes.",
    body:
      "The page needs public proof, source links, screenshots, timelines, and clean language that ordinary people can follow fast.",
  },
  {
    label: "Money",
    title: "Sell real work before selling hype.",
    body:
      "Calls, audits, story pages, site builds, case organization, and platform setup create revenue without ads or platform dependency.",
  },
  {
    label: "Ownership",
    title: "Social media becomes the billboard.",
    body:
      "X, Facebook, YouTube, and TikTok should point back to the owned feed. The website becomes the home base.",
  },
];

const roadmap = [
  "Card checkout for concrete services is live first.",
  "Stablecoin checkout can be enabled through the existing Stripe checkout path after Stripe approves the payment method.",
  "Site credits can come next as prepaid, non-transferable credits for services on this site.",
  "Any public token or tradable coin comes only after legal review, disclosures, and no investment-promise language.",
];

export default function OwnYourFeedPage() {
  return (
    <article>
      <section className="relative min-h-[68vh] overflow-hidden border-b border-[var(--color-line)]">
        <Image
          src="/social-cards/map-room.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#081426]/75" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[68vh] max-w-5xl flex-col justify-end px-4 py-10 text-[#fdf8ea]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8c89e]">
            Real Ryan Nichols platform builds
          </p>
          <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-[0.98] tracking-normal sm:text-7xl">
            Own Your Feed
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#f6efdf] sm:text-lg">
            I built my own platform because I got tired of renting attention
            from companies that can throttle, lock, or erase it. I can build
            yours too.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/store/build-your-site"
              className="btn-accent inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold"
            >
              Start with a site build
            </Link>
            <Link
              href="/store/site-audit"
              className="inline-flex items-center justify-center rounded-lg border border-[#d8c89e] bg-[#fdf8ea] px-5 py-3 text-sm font-bold text-[#142a52] transition hover:border-[#fdf8ea]"
            >
              Get the audit first
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-3 px-4 py-5 sm:grid-cols-4">
        {[
          ["No ads", "Revenue comes from services and support."],
          ["No algorithm", "Social platforms point back to the domain."],
          ["No lock-in", "The home base belongs to you."],
          ["No hype coin", "Crypto starts as payments and credits."],
        ].map(([k, v]) => (
          <div key={k} className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-bold text-[var(--color-ink)]">{k}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{v}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              The offer
            </p>
            <h2 className="mt-2 text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
              A personal media platform, not another profile page.
            </h2>
          </div>
          <div className="prose-body text-[var(--color-ink-soft)]">
            <p>
              This is for people who are tired of building on rented land:
              creators, whistleblowers, local investigators, candidates,
              families, veterans, churches, small businesses, and anyone with a
              story that needs to live somewhere stable.
            </p>
            <p>
              The goal is simple: make your site the place people have to visit
              to see the newest post, video, document, receipt, update, or ask.
              Social media becomes the outbound siren. Your website becomes the
              record.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {layers.map((item) => (
            <div key={item.label} className="border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-blue)]">
                {item.label}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-normal">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-blue)] text-[#fdf8ea]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8c89e]">
            Pick the lane
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-normal text-[#fdf8ea] sm:text-4xl">
            Start small, or build the whole platform.
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
            {offers.map((offer) => (
              <Link
                key={offer.href}
                href={offer.href}
                className="flex min-h-[21rem] flex-col border border-[#d8c89e]/50 bg-[#fdf8ea] p-4 text-[var(--color-ink)] transition hover:border-[#fdf8ea]"
              >
                <p className="text-2xl font-bold text-[var(--color-accent)]">{offer.price}</p>
                <h3 className="mt-2 text-xl font-bold tracking-normal">{offer.name}</h3>
                <p className="mt-2 text-sm font-semibold text-[var(--color-ink-soft)]">
                  {offer.summary}
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-snug text-[var(--color-ink-soft)]">
                  {offer.details.map((detail) => (
                    <li key={detail} className="border-l-2 border-[var(--color-line)] pl-2">
                      {detail}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto pt-5 text-sm font-bold text-[var(--color-blue)]">
                  Open checkout -&gt;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Crypto and credits
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
            The token plan has to be useful before it is tradable.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            A token that promises value growth creates legal and trust problems
            before it creates utility. The safer path is payments first, site
            credits second, and any public token only after counsel reviews the
            structure.
          </p>
        </div>
        <div className="space-y-3">
          {roadmap.map((step, index) => (
            <div key={step} className="flex gap-3 border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-[#fdf8ea]">
                {index + 1}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-normal">
              Want a feed people have to come to?
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              Start with the audit if you need clarity. Start with the build if
              you already know you need your own house.
            </p>
          </div>
          <Link
            href="/store"
            className="btn-blue inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold"
          >
            View all services
          </Link>
        </div>
      </section>
    </article>
  );
}
