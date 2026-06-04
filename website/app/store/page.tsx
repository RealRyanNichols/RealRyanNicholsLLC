import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";
import { StoryProtectionDemo } from "@/components/StoryProtectionDemo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Store | Case Help, Services, and Support",
  description:
    "Hire Ryan Nichols for focused review, evidence organization, public-records help, owned-site services, and direct support for the work.",
  alternates: { canonical: `${SITE.url}/store` },
};

type Product = {
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  type: string;
};

function usd(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

// Ordered product groups. Only non-empty groups render, so the page reads
// cleanly whether there are four services today or forty mixed products later.
const GROUPS: { type: string; label: string; blurb: string }[] = [
  {
    type: "service",
    label: "Paid services",
    blurb: "Flat-fee help for clarity, attention, public records, and owned-site work.",
  },
  {
    type: "digital",
    label: "Digital tools",
    blurb: "Downloads, templates, checklists, and starter files you keep.",
  },
  {
    type: "physical",
    label: "Physical items",
    blurb: "Signed, tangible, shipped items when available.",
  },
];

const PRODUCT_DETAILS: Record<
  string,
  {
    tag: string;
    bestFor: string;
    includes: string[];
    cta: string;
    image: {
      src: string;
      alt: string;
    };
  }
> = {
  "strategy-call-30": {
    tag: "Best first move",
    bestFor:
      "You have facts, links, screenshots, a case issue, a story, or a site problem and need the next three moves.",
    includes: [
      "Focused 30-minute call",
      "Plain-English direction",
      "Next-step action list",
    ],
    cta: "Book the call",
    image: {
      src: "/uploads/strategy-call-30-og.png",
      alt: "30-minute strategy call thumbnail for Ryan Nichols.",
    },
  },
  "site-audit": {
    tag: "Attention audit",
    bestFor:
      "Your site, feed, Substack, service page, or public story is not converting attention into action.",
    includes: [
      "Written audit",
      "Trust and clarity fixes",
      "Priority conversion changes",
    ],
    cta: "Get the audit",
    image: {
      src: "/uploads/why-posting-og-thumbnail.png",
      alt: "A public proof and posting visual representing attention and trust review.",
    },
  },
  "build-your-site": {
    tag: "Owned platform",
    bestFor:
      "You need a domain-first home for your posts, proof, contact path, service offers, and support flow.",
    includes: [
      "Site/feed build",
      "Service and support path",
      "Basic analytics handoff",
    ],
    cta: "Start the build",
    image: {
      src: "/uploads/today-only-build-og.png",
      alt: "A website build visual for owned publishing and service conversion.",
    },
  },
  "codebase-domain-bundle": {
    tag: "Full setup",
    bestFor:
      "You need the deeper platform setup: site, domain guidance, launch copy, analytics, SEO basics, and follow-up.",
    includes: [
      "Website and launch copy",
      "Domain and SEO basics",
      "30-day check-in",
    ],
    cta: "Build the platform",
    image: {
      src: "/social-cards/map-room.jpg",
      alt: "A map room visual representing a complete domain, records, and publishing setup.",
    },
  },
};

const decisionCards = [
  {
    title: "I need help with a case or records",
    body: "Use this when you have filings, screenshots, messages, reports, public records, or a messy timeline and need direction.",
    href: "/case-review",
    cta: "Start case review",
  },
  {
    title: "I have a tip, document, or lead",
    body: "Send names, dates, links, court records, screenshots, videos, or missing-record leads into Ryan's review queue.",
    href: "/submit",
    cta: "Submit a tip",
  },
  {
    title: "I need Ryan's paid service",
    body: "Book a call, get an audit, or hire Ryan to build a stronger owned page, feed, or public-record presentation.",
    href: "#service-options",
    cta: "See services",
  },
  {
    title: "I want to support or gift help",
    body: "Back the records work directly, support public case documentation, or help make service access possible for someone else.",
    href: "/support",
    cta: "Support the work",
  },
];

const processSteps = [
  {
    title: "1. Pick the smallest useful move",
    body: "Start with the call or case review unless you already know you need a build.",
  },
  {
    title: "2. Checkout or submit",
    body: "Paid services go through Stripe, with cards, Link, Klarna, Affirm, Afterpay/Clearpay, and other eligible options shown when Stripe supports them. Tips and case-review paths collect the facts first.",
  },
  {
    title: "3. Ryan reviews the record",
    body: "The work stays evidence-first: dates, documents, people, issues, missing records, and next steps.",
  },
];

const heroSignals = [
  ["Story", "What happened, in plain English."],
  ["Proof", "Dates, records, links, screenshots."],
  ["Privacy", "What must stay protected."],
  ["Next move", "The smallest useful action."],
];

const recordFlow = [
  {
    label: "Bring the chaos",
    body: "Screenshots, filings, videos, court links, texts, names, dates, public-records problems, or a site that is not working.",
  },
  {
    label: "Build the record",
    body: "Ryan separates facts, claims, proof, missing documents, people involved, and the safest public angle.",
  },
  {
    label: "Pick the action",
    body: "Case review, private tip, story draft, strategy call, site audit, build, support, or checkout.",
  },
];

function ProductCard({ p }: { p: Product }) {
  const detail = PRODUCT_DETAILS[p.slug];
  const image = p.image_url
    ? { src: p.image_url, alt: p.name }
    : detail?.image ?? {
        src: "/social-cards/map-room.jpg",
        alt: "A records map room visual for Real Ryan Nichols LLC services.",
      };

  return (
    <Link
      href={`/store/${p.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] transition hover:border-[var(--color-accent)]"
    >
      <div className="relative h-40 w-full overflow-hidden bg-[var(--color-surface-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-[var(--color-ink)]/88 px-4 py-3 text-white">
          <span className="text-xs font-bold uppercase tracking-normal text-white/70">
            {detail?.tag ?? p.type}
          </span>
          <span className="text-2xl font-bold text-white">
            {usd(p.price_cents)}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl font-bold tracking-normal group-hover:text-[var(--color-accent)]">
          {p.name}
        </h3>
        {p.description ? (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {p.description}
          </p>
        ) : null}

        {detail ? (
          <>
            <p className="mt-4 text-sm font-bold text-[var(--color-ink)]">
              Best for:
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {detail.bestFor}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-soft)]">
              {detail.includes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p className="mt-5 flex items-center justify-between border-t border-[var(--color-line)] pt-4 text-sm font-bold text-[var(--color-accent)]">
          <span>{detail?.cta ?? "View details"}</span>
          <span aria-hidden="true">-&gt;</span>
        </p>
      </div>
    </Link>
  );
}

export default async function StorePage() {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("products")
    .select("slug, name, description, image_url, price_cents, type")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const products = (data ?? []) as Product[];

  // Partition into known groups (in order), then sweep up any unknown types.
  const groups = GROUPS.map((g) => ({
    ...g,
    items: products.filter((p) => p.type === g.type),
  })).filter((g) => g.items.length > 0);
  const known = new Set(GROUPS.map((g) => g.type));
  const other = products.filter((p) => !known.has(p.type));
  if (other.length) {
    groups.push({ type: "other", label: "More", blurb: "", items: other });
  }

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Real Ryan Nichols LLC store",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        url: `${SITE.url}/store/${p.slug}`,
        ...(p.description ? { description: p.description } : {}),
        ...(p.image_url ? { image: p.image_url } : {}),
        offers: {
          "@type": "Offer",
          price: (p.price_cents / 100).toFixed(2),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${SITE.url}/store/${p.slug}`,
        },
      },
    })),
  };

  return (
    <article className="rrn-page">
      {products.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      ) : null}

      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/record-they-cant-bury-og-thumbnail.png"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-paper)_0%,rgba(246,239,223,0.96)_48%,rgba(246,239,223,0.88)_100%)]" />
        <div className="rrn-hero-inner relative grid gap-6 lg:grid-cols-[1fr_0.92fr] lg:gap-8">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Store / Story / Record / Service
            </p>
            <h1 className="rrn-hero-title mt-3 max-w-3xl">
              Bring the mess. Build the record.
            </h1>
            <p className="rrn-lead mt-4 max-w-2xl">
              This is not just checkout. It is the path from scattered facts to
              a clearer review, article angle, service order, or support flow.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {heroSignals.map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
                >
                  <p className="text-sm font-black text-[var(--color-ink)]">
                    {title}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-[var(--color-muted)]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
            <div className="rrn-tap-row mt-6">
              <Link
                href="#article-demo"
                className="rrn-tap btn-accent inline-flex rounded-lg px-5 py-3 text-sm font-bold"
              >
                Try the article demo
              </Link>
              <Link
                href="#service-options"
                className="rrn-tap inline-flex rounded-lg border-2 border-[var(--color-blue)] px-5 py-3 text-sm font-bold text-[var(--color-blue)] transition hover:bg-[var(--color-blue-soft)]"
              >
                See paid services
              </Link>
              <Link
                href="/case-review"
                className="rrn-tap inline-flex rounded-lg border-2 border-[var(--color-line)] px-5 py-3 text-sm font-bold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)]"
              >
                Start case review
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] shadow-xl">
            <div className="relative h-48 bg-[var(--color-surface-2)] sm:h-56">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/uploads/master-exhibit-index-og-thumbnail.png"
                alt="A visual of organized evidence and a master exhibit index."
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,42,82,0.06),rgba(20,42,82,0.82))]" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs font-black uppercase tracking-normal text-[#7fe3a9]">
                  The useful path
                </p>
                <p className="mt-1 max-w-sm font-display text-2xl font-black leading-tight tracking-normal text-white sm:text-3xl">
                  Chaos becomes a timeline, index, article, or next move.
                </p>
              </div>
            </div>
            <div className="p-5">
              <div className="grid gap-3">
                {recordFlow.map((item, index) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[2.25rem_1fr] gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-blue)] text-sm font-black text-[var(--color-paper)]">
                      {index + 1}
                    </span>
                    <span>
                      <strong className="block text-sm font-black text-[var(--color-ink)]">
                        {item.label}
                      </strong>
                      <span className="mt-1 block text-xs leading-relaxed text-[var(--color-ink-soft)]">
                        {item.body}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
                Ryan is not a lawyer and Real Ryan Nichols LLC is not a law
                firm. No legal advice, no outcome promises, no fake certainty.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rrn-section">
        <StoryProtectionDemo />
      </section>

      <section className="rrn-section pt-0">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
            Choose your lane
          </p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">
            Do the thing that matches what you have.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {decisionCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rrn-card group block min-h-32 p-4 transition hover:border-[var(--color-accent)]"
            >
              <h2 className="font-display text-xl font-bold tracking-normal group-hover:text-[var(--color-accent)]">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {card.body}
              </p>
              <p className="mt-4 text-sm font-bold text-[var(--color-accent)]">
                {card.cta} -&gt;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {products.length === 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-[var(--color-ink-soft)]">
            The checkout shelf is being updated. In the meantime,{" "}
            <Link
              href="/case-review"
              className="font-bold text-[var(--color-accent)] underline underline-offset-4"
            >
              start a case review
            </Link>{" "}
            or{" "}
            <Link
              href="/support"
              className="font-bold text-[var(--color-accent)] underline underline-offset-4"
            >
              support the work here
            </Link>
            .
          </p>
        </section>
      ) : (
        <div
          id="service-options"
          className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:space-y-10"
        >
          {groups.map((group) => (
            <section key={group.type}>
              <div className="flex flex-col gap-2 border-b border-[var(--color-line)] pb-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
                    Checkout
                  </p>
                  <h2 className="font-display text-3xl font-bold tracking-normal">
                    {group.label}
                  </h2>
                </div>
                {group.blurb ? (
                  <p className="max-w-lg text-sm leading-relaxed text-[var(--color-muted)]">
                    {group.blurb}
                  </p>
                ) : null}
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((p) => (
                  <ProductCard key={p.slug} p={p} />
                ))}
              </div>
            </section>
          ))}

          <section className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 lg:grid-cols-3">
            {processSteps.map((step) => (
              <div key={step.title}>
                <h3 className="font-display text-xl font-bold tracking-normal">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {step.body}
                </p>
              </div>
            ))}
          </section>

          <div className="flex flex-col gap-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-ink)] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-normal text-white">
                Not sure which one you need?
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/80">
                Start smaller. Use the guide, send a tip, or book the call.
                The right first move is the one that gets the facts into order
                without overbuying.
              </p>
            </div>
            <div className="rrn-tap-row flex-none">
              <Link
                href="/services"
                className="rrn-tap inline-flex rounded-lg bg-white px-5 py-3 text-sm font-bold text-[var(--color-ink)] transition hover:bg-[var(--color-paper)]"
              >
                Services guide
              </Link>
              <Link
                href="/store/strategy-call-30"
                className="rrn-tap inline-flex rounded-lg border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Book the call
              </Link>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
