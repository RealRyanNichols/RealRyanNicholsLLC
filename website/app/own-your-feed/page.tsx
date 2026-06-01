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

const comparison = [
  {
    issue: "Who decides who sees you",
    rented: "An algorithm — and it changes the rules without telling you.",
    owned: "Anyone who visits your domain. No gatekeeper in the middle.",
  },
  {
    issue: "If you get banned or throttled",
    rented: "Your audience disappears overnight.",
    owned: "You keep every post, every email, every supporter.",
  },
  {
    issue: "Outbound links",
    rented: "Buried, because the platform wants you to stay put.",
    owned: "Every post is a link you own and can share anywhere.",
  },
  {
    issue: "Making money",
    rented: "Ads, or a cut handed to the platform.",
    owned: "Calls, audits, builds, prints, support — paid to you, direct.",
  },
  {
    issue: "Your record",
    rented: "Posts scroll away and get harder to find by the hour.",
    owned: "A permanent, searchable archive on your own site.",
  },
  {
    issue: "Your proof",
    rented: "Screenshots get “context”-flagged or quietly removed.",
    owned: "Receipts live on a page only you control.",
  },
];

const buildSteps = [
  {
    n: "01",
    title: "Start with a call or an audit",
    body: "A $197 call or a $297 written audit maps your story, your audience, and the fastest path to money — before anyone writes a line of code.",
  },
  {
    n: "02",
    title: "I build it on your domain",
    body: "An owned feed, the pages you need, basic analytics, and a clear way for people to contact, support, or buy. Built around your message and your proof.",
  },
  {
    n: "03",
    title: "You get the keys",
    body: "A 30-day handoff so you can keep posting without me. Your domain, your accounts, your content — you own all of it.",
  },
];

const proof = [
  { href: "/", label: "The feed", body: "Every post lands on a domain I own first — social just points back." },
  { href: "/the-harassment", label: "The Receipts Wall", body: "Every threat and ban, kept in public and searchable." },
  { href: "/case", label: "The case file", body: "A structured public record, not a buried thread." },
  { href: "/impact", label: "Transparency", body: "Public numbers anyone can check." },
  { href: "/store", label: "The store", body: "Take payment for real work. No ads, no middleman." },
];

const faqs = [
  {
    q: "Do I actually own it?",
    a: "Yes. Your domain, your content, your email list, your accounts. If we ever part ways, you keep everything and nothing disappears.",
  },
  {
    q: "Why not just use Substack, X, or Facebook?",
    a: "Those rent you an audience and can throttle, lock, or erase it. This puts your home base on a domain you control. Social media becomes the billboard that points back to it.",
  },
  {
    q: "Can I move my existing posts over?",
    a: "Yes. Bringing your existing posts and audience onto the owned feed is part of the build.",
  },
  {
    q: "What about the domain and hosting?",
    a: "We sort it out on the call, and you own the domain and the accounts from day one. The build is set up so you are never locked to me.",
  },
  {
    q: "Do you take crypto?",
    a: "Card payments work today. Stablecoin payments are being added through Stripe. Any future site credits are prepaid and only good for services here — they are not an investment and carry no promise of value.",
  },
  {
    q: "How long does it take?",
    a: "A basic owned feed launches fast. The Codebase + Domain bundle adds SEO basics, analytics, launch copy, and a 30-day check-in.",
  },
];

const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Own Your Feed — domain-first feed and platform builds",
  serviceType: "Website and owned-media platform builds",
  provider: { "@type": "Person", name: "Ryan Nichols", url: SITE.url },
  areaServed: "US",
  url: `${SITE.url}/own-your-feed`,
  description:
    "Ryan Nichols builds domain-first feeds and public-record sites so creators, investigators, and small organizations can stop renting attention from social platforms.",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Platform build services",
    itemListElement: offers.map((o) => ({
      "@type": "Offer",
      price: o.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
      url: `${SITE.url}${o.href}`,
      itemOffered: { "@type": "Service", name: o.name, description: o.summary },
    })),
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function OwnYourFeedPage() {
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
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

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Rented land vs. your own home
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
            You don&apos;t own a thing you can be evicted from.
          </h2>
          <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-line)]">
            <div className="grid grid-cols-1 bg-[var(--color-surface-2)] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)] sm:grid-cols-3">
              <div className="px-4 py-3">The question</div>
              <div className="border-t border-[var(--color-line)] px-4 py-3 sm:border-l sm:border-t-0">
                On rented land
              </div>
              <div className="border-t border-[var(--color-line)] px-4 py-3 text-[var(--color-blue)] sm:border-l sm:border-t-0">
                On your own domain
              </div>
            </div>
            {comparison.map((row) => (
              <div
                key={row.issue}
                className="grid grid-cols-1 border-t border-[var(--color-line)] text-sm sm:grid-cols-3"
              >
                <div className="px-4 py-3 font-bold text-[var(--color-ink)]">{row.issue}</div>
                <div className="border-t border-[var(--color-line)] px-4 py-3 text-[var(--color-ink-soft)] sm:border-l sm:border-t-0">
                  {row.rented}
                </div>
                <div className="border-t border-[var(--color-line)] bg-[var(--color-blue-soft)] px-4 py-3 font-semibold text-[var(--color-ink)] sm:border-l sm:border-t-0">
                  {row.owned}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          How the build works
        </p>
        <h2 className="mt-2 text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
          Three steps from rented to owned.
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {buildSteps.map((step) => (
            <div
              key={step.n}
              className="border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
            >
              <p className="text-3xl font-bold text-[var(--color-line)]">{step.n}</p>
              <h3 className="mt-2 text-xl font-bold tracking-normal">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {step.body}
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

      <section className="border-t border-[var(--color-line)]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Proof — you&apos;re reading it on one
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
            This site is the demo. Every piece of it is an owned feed at work.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            I didn&apos;t read this in a book. I built it here first, under fire, and it
            holds. Click anything below — it all runs on the same kind of platform I&apos;d
            build for you.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proof.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-accent)]"
              >
                <p className="text-sm font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                  {item.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                  {item.body}
                </p>
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
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Questions
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
            Straight answers before you spend a dollar.
          </h2>
          <div className="mt-6 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
            {faqs.map((f) => (
              <details key={f.q} className="group px-1 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[var(--color-ink)]">
                  {f.q}
                  <span
                    className="flex-none text-xl leading-none text-[var(--color-accent)] transition group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
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
