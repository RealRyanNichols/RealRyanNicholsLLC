import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { BuyButton } from "@/components/BuyButton";
import { J6ClaimButton } from "@/components/J6ClaimButton";
import { OfferDecisionTool } from "@/components/OfferDecisionTool";

// Per-user (J6 free path depends on the signed-in user) — render on demand.
export const dynamic = "force-dynamic";

function usd(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

type Product = {
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  type: string;
};

const STRATEGY_CALL_SLUG = "strategy-call-30";
const STRATEGY_CALL_IMAGE = "/uploads/strategy-call-30-og.png";
const STRATEGY_CALL_TITLE = "30-Minute Strategy Call with Ryan Nichols";
const STRATEGY_CALL_DESCRIPTION =
  "A recorded 30-minute strategy call to turn your business, site, software, ads, funnels, automations, or client-charging problem into a clear build plan.";

type SalesOffer = {
  eyebrow: string;
  headline: string;
  lead: string;
  image: { src: string; alt: string };
  briefHref: string;
  primaryProblem: string;
  stakes: string[];
  outcomes: { title: string; body: string; tone: string }[];
  bars: { label: string; value: number; caption: string; tone: string }[];
  deliverables: { title: string; body: string }[];
  process: { title: string; body: string }[];
  comparisons: { before: string; after: string }[];
  faq: { q: string; a: string }[];
};

const SALES_OFFERS: Record<string, SalesOffer> = {
  "site-audit": {
    eyebrow: "Attention audit / clarity review / conversion fixes",
    headline: "Find what is costing you trust, clicks, and money.",
    lead:
      "Ryan reviews your site, feed, Substack, service page, or public story and tells you what is confusing people, what is missing, and what should be fixed first.",
    image: {
      src: "/uploads/why-posting-og-thumbnail.png",
      alt: "A public posting and proof visual for a site audit.",
    },
    briefHref: "/contact",
    primaryProblem:
      "You are getting attention, but the page does not make the next move obvious enough.",
    stakes: [
      "People land on the page and do not understand the offer fast.",
      "The trust signals, proof, pricing path, or call-to-action are buried.",
      "You keep guessing instead of fixing the highest-friction parts first.",
    ],
    outcomes: [
      {
        title: "Plain-English diagnosis",
        body: "What is confusing, weak, too slow, too hidden, or not believable enough.",
        tone: "bg-[#e9f2ff]",
      },
      {
        title: "Priority fix list",
        body: "The few changes that should be made first instead of a giant generic redesign.",
        tone: "bg-[#fff5d6]",
      },
      {
        title: "Offer and CTA cleanup",
        body: "Where the page should ask for attention, information, payment, or support.",
        tone: "bg-[#e8f7ed]",
      },
    ],
    bars: [
      { label: "Clarity", value: 92, caption: "Can they understand the offer fast?", tone: "bg-[var(--color-blue)]" },
      { label: "Trust", value: 84, caption: "Does the page show proof before asking?", tone: "bg-[var(--color-success)]" },
      { label: "Action", value: 88, caption: "Is the next button obvious on mobile?", tone: "bg-[var(--color-support)]" },
      { label: "Friction", value: 34, caption: "Lower is better: fewer confusing steps.", tone: "bg-[var(--color-accent)]" },
    ],
    deliverables: [
      { title: "Written audit", body: "A direct review of what works, what fails, and what to fix first." },
      { title: "Mobile-first notes", body: "What breaks or feels weak on the phone view where most people arrive." },
      { title: "CTA map", body: "Where to ask for a lead, a checkout, a tip, a comment, or a booking." },
      { title: "Trust signal pass", body: "Proof, receipts, testimonials, media, images, and credibility gaps." },
      { title: "Offer copy cleanup", body: "Plain-language edits that make the offer easier to believe and buy." },
      { title: "Next three moves", body: "A small action list so the audit becomes work, not just notes." },
    ],
    process: [
      { title: "Send the page", body: "Give Ryan the URL, what you want people to do, and what feels broken." },
      { title: "Ryan reviews the path", body: "He reads the page like a real visitor: first impression, trust, proof, CTA, checkout, mobile." },
      { title: "You get the fix order", body: "You know what should be fixed first, what can wait, and what may need a bigger build." },
    ],
    comparisons: [
      { before: "A page with good intentions but no obvious next move.", after: "A page that tells visitors exactly why they should act now." },
      { before: "Generic sections and weak proof.", after: "Receipts, screenshots, offer clarity, and stronger calls to action." },
      { before: "Guessing what is wrong.", after: "A written fix list ranked by attention, trust, and money impact." },
    ],
    faq: [
      { q: "Is this a redesign?", a: "No. It is an audit. Ryan tells you what to fix first. A redesign or build can come after that if needed." },
      { q: "Can this review a social profile or Substack?", a: "Yes. The point is attention and action, not just traditional websites." },
      { q: "Will Ryan write the new copy?", a: "This offer includes audit direction and plain-language fixes. Bigger rewrite or build work can be scoped separately." },
    ],
  },
  "build-your-site": {
    eyebrow: "Owned platform / service page / lead engine",
    headline: "Get a site people can use, not just look at.",
    lead:
      "Ryan builds a domain-first site with a clear offer, contact path, service pages, proof, analytics, and a structure that can grow into a dashboard, store, or public record.",
    image: {
      src: "/uploads/today-only-build-og.png",
      alt: "A website build offer visual.",
    },
    briefHref: "/contact",
    primaryProblem:
      "You need one owned place where people can read, trust, contact, pay, and come back.",
    stakes: [
      "Social platforms do not give you ownership, structure, or reliable reach.",
      "A weak site makes people leave before they understand the offer.",
      "Without forms, checkout, analytics, and follow-up paths, attention disappears.",
    ],
    outcomes: [
      {
        title: "A real owned homepage",
        body: "A first screen that explains who you are, what you offer, and what the visitor should do.",
        tone: "bg-[#fff5d6]",
      },
      {
        title: "Lead and contact paths",
        body: "Forms, private contact, service buttons, and routes that collect the right information.",
        tone: "bg-[#e8f7ed]",
      },
      {
        title: "Checkout-ready structure",
        body: "A site that can support payments, offers, support, invoices, and service pages.",
        tone: "bg-[#e9f2ff]",
      },
    ],
    bars: [
      { label: "Ownership", value: 96, caption: "Your domain, your record, your path.", tone: "bg-[var(--color-blue)]" },
      { label: "Lead capture", value: 86, caption: "Forms and CTAs instead of dead ends.", tone: "bg-[var(--color-success)]" },
      { label: "Checkout path", value: 78, caption: "Ready for service sales and support.", tone: "bg-[var(--color-support)]" },
      { label: "Platform risk", value: 28, caption: "Lower is better than relying only on social.", tone: "bg-[var(--color-accent)]" },
    ],
    deliverables: [
      { title: "Mobile-first site", body: "A usable site that reads clean on phones before desktop polish." },
      { title: "Offer page structure", body: "Service pages and CTAs that tell people what to do next." },
      { title: "Contact/intake route", body: "A way for visitors to send information instead of just bouncing." },
      { title: "Basic analytics", body: "Enough tracking to see what people are reading and clicking." },
      { title: "Owned-feed direction", body: "A structure for posts, updates, receipts, or public proof." },
      { title: "Launch handoff", body: "What is live, what to watch, and what to build next." },
    ],
    process: [
      { title: "Give Ryan the offer", body: "Tell him who the site is for, what you sell, what proof exists, and what people should do." },
      { title: "Ryan builds the structure", body: "Homepage, service path, contact flow, proof sections, and the first conversion route." },
      { title: "You launch and improve", body: "The first version goes live, then analytics and real visitor behavior guide the next upgrades." },
    ],
    comparisons: [
      { before: "Scattered links, posts, DMs, and no owned record.", after: "One domain that explains, collects, sells, and stores your public proof." },
      { before: "A pretty page with no action path.", after: "A working site with forms, buttons, service pages, and analytics." },
      { before: "Depending on social media to remember your work.", after: "A site you own, control, update, and build on." },
    ],
    faq: [
      { q: "Is this custom software?", a: "This is a site build. Custom software, dashboards, portals, and API work can be scoped after the site path is clear." },
      { q: "Can payments be added?", a: "Yes. Stripe checkout, invoices, and offer pages can be added when the offer is ready." },
      { q: "What if I do not know what the site should say?", a: "Start with the strategy call or send the brief. Ryan can help find the offer and first page structure." },
    ],
  },
  "codebase-domain-bundle": {
    eyebrow: "Platform setup / codebase / domain / launch system",
    headline: "Build the business system behind the website.",
    lead:
      "This is the deeper setup for people who need more than a page: domain-first publishing, codebase structure, analytics, checkout readiness, automation paths, and a launch plan.",
    image: {
      src: "/social-cards/map-room.jpg",
      alt: "A map room visual for a complete platform setup.",
    },
    briefHref: "/contact",
    primaryProblem:
      "You need the platform, the domain, the code, and the money path organized together.",
    stakes: [
      "A website without a codebase strategy becomes hard to maintain.",
      "A domain without analytics, forms, and checkout does not become a business.",
      "Disconnected tools create manual work, lost leads, and unclear ownership.",
    ],
    outcomes: [
      {
        title: "Codebase foundation",
        body: "A maintainable starting point for the public site, service pages, data, and future tools.",
        tone: "bg-[#e9f2ff]",
      },
      {
        title: "Domain and launch path",
        body: "A practical route for the domain, public pages, SEO basics, and launch messaging.",
        tone: "bg-[#fff5d6]",
      },
      {
        title: "Business stack map",
        body: "Where Stripe, Supabase, Vercel, email, analytics, and automations fit into the system.",
        tone: "bg-[#e8f7ed]",
      },
    ],
    bars: [
      { label: "Foundation", value: 95, caption: "Code, domain, data, and publishing path.", tone: "bg-[var(--color-blue)]" },
      { label: "Automation ready", value: 82, caption: "Built so workflows can be added later.", tone: "bg-[var(--color-success)]" },
      { label: "Money path", value: 88, caption: "Offers, checkout, invoices, or support can plug in.", tone: "bg-[var(--color-support)]" },
      { label: "Tool sprawl", value: 26, caption: "Lower is better: fewer disconnected pieces.", tone: "bg-[var(--color-accent)]" },
    ],
    deliverables: [
      { title: "Codebase setup", body: "A practical project foundation instead of a dead one-off page." },
      { title: "Domain guidance", body: "Where the site should live and how the public route should be framed." },
      { title: "Launch copy", body: "Homepage, offer, and public explanation language to get started." },
      { title: "Analytics basics", body: "Tracking that shows what people see, click, and return to." },
      { title: "Payment readiness", body: "A plan for checkout, invoice, support, or service purchase flows." },
      { title: "30-day check-in", body: "A follow-up pass to decide what should be improved after launch data comes in." },
    ],
    process: [
      { title: "Map the business", body: "Ryan looks at the offer, audience, domain, tools, payment path, and data you need to keep." },
      { title: "Build the foundation", body: "The codebase and pages are organized around publishing, collecting, selling, and learning." },
      { title: "Launch with a next-step list", body: "You know what is live, what is missing, and what should be automated or monetized next." },
    ],
    comparisons: [
      { before: "A domain idea and scattered SaaS tools.", after: "A coherent platform with public pages, data paths, and checkout direction." },
      { before: "No clear place for leads, content, payments, or analytics.", after: "A stack map that explains where everything belongs." },
      { before: "A launch that depends on memory.", after: "A site, codebase, and 30-day improvement plan." },
    ],
    faq: [
      { q: "Is this for a bigger build?", a: "Yes. This is for people who need the platform foundation, not only a single landing page." },
      { q: "Does it include custom APIs?", a: "It includes the map and setup direction. Specific API integrations can be scoped depending on what the business needs." },
      { q: "Why is this more than the site build?", a: "Because it includes codebase/domain structure, launch planning, analytics direction, and a 30-day improvement pass." },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabaseStaticClient();
  const { data: p } = await supabase
    .from("products")
    .select("name, description, image_url")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!p) return { title: "Not found" };
  if (slug === STRATEGY_CALL_SLUG) {
    const image = `${SITE.url}${STRATEGY_CALL_IMAGE}`;
    return {
      title: `${STRATEGY_CALL_TITLE} — Store`,
      description: STRATEGY_CALL_DESCRIPTION,
      alternates: { canonical: `${SITE.url}/store/${slug}` },
      openGraph: {
        title: STRATEGY_CALL_TITLE,
        description: STRATEGY_CALL_DESCRIPTION,
        url: `${SITE.url}/store/${slug}`,
        type: "website",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: "Strategy Call 30 Minutes with Ryan Nichols",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: STRATEGY_CALL_TITLE,
        description: STRATEGY_CALL_DESCRIPTION,
        images: [image],
      },
    };
  }
  return {
    title: `${p.name} — Store`,
    description: p.description ?? undefined,
    alternates: { canonical: `${SITE.url}/store/${slug}` },
    openGraph: {
      title: p.name,
      description: p.description ?? undefined,
      images: p.image_url ? [p.image_url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseStaticClient();
  const { data: p } = await supabase
    .from("products")
    .select("slug, name, description, image_url, price_cents, type")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!p) notFound();

  // Verified J6 defendant? They get the free path.
  let j6Eligible = false;
  try {
    const userClient = await getSupabaseServerClient();
    const { data: auth } = await userClient.auth.getUser();
    if (auth.user) {
      const { data: v } = await userClient.rpc("is_verified_j6_defendant", {
        uid: auth.user.id,
      });
      j6Eligible = v === true;
    }
  } catch {
    /* not signed in / ignore */
  }

  if (p.slug === STRATEGY_CALL_SLUG) {
    return <StrategyCallPage product={p as Product} j6Eligible={j6Eligible} />;
  }

  return <OfferSalesPage product={p as Product} j6Eligible={j6Eligible} />;
}

function getSalesOffer(product: Product): SalesOffer {
  return SALES_OFFERS[product.slug] ?? {
    eyebrow: `${product.type} / direct offer / next step`,
    headline: product.name,
    lead:
      product.description ??
      "A focused Real Ryan Nichols LLC offer built to turn scattered facts, attention, or business needs into a clearer next move.",
    image: {
      src: product.image_url ?? "/social-cards/map-room.jpg",
      alt: product.name,
    },
    briefHref: "/contact",
    primaryProblem:
      "You need the right next move without a bloated proposal or fake promises.",
    stakes: [
      "The work stays stuck when the next action is unclear.",
      "People lose attention when the page does not explain the value fast.",
      "A focused service can turn the problem into a plan, record, or build path.",
    ],
    outcomes: [
      {
        title: "Clear direction",
        body: "A practical next step based on what you actually have.",
        tone: "bg-[#e9f2ff]",
      },
      {
        title: "Better structure",
        body: "Facts, offer, proof, audience, and action path organized into plain English.",
        tone: "bg-[#fff5d6]",
      },
      {
        title: "Action path",
        body: "A route toward payment, support, information capture, or the next build.",
        tone: "bg-[#e8f7ed]",
      },
    ],
    bars: [
      { label: "Clarity", value: 82, caption: "The first thing every offer needs.", tone: "bg-[var(--color-blue)]" },
      { label: "Trust", value: 76, caption: "Proof and plain language before the ask.", tone: "bg-[var(--color-success)]" },
      { label: "Action", value: 80, caption: "A visible next step.", tone: "bg-[var(--color-support)]" },
      { label: "Friction", value: 36, caption: "Lower is better.", tone: "bg-[var(--color-accent)]" },
    ],
    deliverables: [
      { title: "Focused review", body: "Ryan looks at the facts, offer, page, or situation." },
      { title: "Plain-English notes", body: "No corporate filler. Just what matters and why." },
      { title: "Next move", body: "A practical action path after the service is complete." },
    ],
    process: [
      { title: "Buy or send the brief", body: "Use checkout when you are ready, or contact Ryan first if private context matters." },
      { title: "Ryan reviews", body: "He looks for the strongest facts, highest friction, and next useful action." },
      { title: "You act", body: "The goal is a clearer page, record, plan, post, or build path." },
    ],
    comparisons: [
      { before: "Unclear problem.", after: "Plain-English direction." },
      { before: "Scattered facts.", after: "Organized next move." },
      { before: "No clear ask.", after: "A button, form, checkout, or support path." },
    ],
    faq: [
      { q: "Is this legal advice?", a: "No. Ryan is not a lawyer and Real Ryan Nichols LLC is not a law firm." },
      { q: "Can I send context before paying?", a: "Yes. Use the brief/contact path if Ryan needs to understand the situation first." },
      { q: "What if this is not the right offer?", a: "Start with the strategy call or contact path so the right next step can be identified." },
    ],
  };
}

function OfferSalesPage({
  product,
  j6Eligible,
}: {
  product: Product;
  j6Eligible: boolean;
}) {
  const offer = getSalesOffer(product);
  const price = usd(product.price_cents);
  const image = product.image_url
    ? { src: product.image_url, alt: product.name }
    : offer.image;
  const pageUrl = `${SITE.url}/store/${product.slug}`;
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: product.name,
    description: offer.lead,
    provider: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.url,
    },
    image: image.src.startsWith("http") ? image.src : `${SITE.url}${image.src}`,
    offers: {
      "@type": "Offer",
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: pageUrl,
    },
  };

  return (
    <article className="rrn-page bg-[var(--color-paper)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />

      <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="absolute inset-0 opacity-[0.1]" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(246,239,223,0.92)_0%,rgba(246,239,223,0.98)_62%,var(--color-paper)_100%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-5 px-4 py-7 sm:px-6 sm:py-9 lg:min-h-[70vh] lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
          <div>
            <nav className="mb-4 text-sm font-bold text-[var(--color-blue)]">
              <Link href="/store" className="hover:underline">
                &lt;- Store
              </Link>
            </nav>
            <p className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              {offer.eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-black leading-[1.03] tracking-normal sm:text-5xl lg:text-7xl">
              {offer.headline}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-xl">
              {offer.lead}
            </p>
            <div className="rrn-tap-row mt-6">
              <a
                href="#buy"
                className="rrn-tap inline-flex rounded-lg bg-[var(--color-support)] px-5 py-3 text-sm font-black text-[#1a1410] shadow-[0_10px_24px_rgba(200,155,47,0.28)] transition hover:bg-[#e1b94e]"
              >
                Buy now - {price}
              </a>
              <Link
                href={offer.briefHref}
                className="rrn-tap inline-flex rounded-lg border-2 border-[var(--color-blue)] bg-[var(--color-surface)] px-5 py-3 text-sm font-black text-[var(--color-blue)] transition hover:bg-[var(--color-blue-soft)]"
              >
                Send Ryan the brief
              </Link>
              <a
                href="#fit-check"
                className="rrn-tap inline-flex rounded-lg border-2 border-[var(--color-line)] bg-white/70 px-5 py-3 text-sm font-black text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
              >
                Check fit
              </a>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {offer.stakes.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm"
                >
                  <p className="text-sm font-bold leading-relaxed text-[var(--color-ink-soft)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside
            id="buy"
            className="rounded-lg border-2 border-[var(--color-support)] bg-[var(--color-surface)] p-4 shadow-[0_18px_50px_rgba(74,62,48,0.16)] lg:sticky lg:top-28"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]" data-ratio-frame>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-normal text-[var(--color-support-strong)]">
              {product.type}
            </p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-normal">
              {product.name}
            </h2>
            <p className="mt-2 text-4xl font-black text-[var(--color-support-strong)]">
              {price}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {offer.primaryProblem}
            </p>
            <div className="mt-5">
              <BuyButton
                slug={product.slug}
                label={`Buy - ${price}`}
                className="w-full rounded-lg bg-[var(--color-support)] px-6 py-4 text-base font-black text-[#1a1410] shadow-[0_12px_28px_rgba(200,155,47,0.32)] transition hover:bg-[#e1b94e] disabled:opacity-60"
              />
              {j6Eligible ? (
                <J6ClaimButton slug={product.slug} />
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                  J6 defendant?{" "}
                  <Link href="/case" className="font-bold text-[var(--color-accent)] underline">
                    Sign in and link your verified case profile
                  </Link>{" "}
                  to claim eligible services free.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="rrn-section">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Why this matters
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal sm:text-4xl">
              Attention only matters if it turns into a clear action.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-soft)]">
              These pages are built to make the value visible before the ask:
              what is broken, what Ryan does, what changes after the work, and
              where the visitor should go next.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {offer.outcomes.map((item) => (
              <div
                key={item.title}
                className={`rounded-lg border border-[var(--color-line)] ${item.tone} p-4 shadow-sm`}
              >
                <h3 className="font-display text-xl font-black tracking-normal">
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

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-5 rounded-lg border-2 border-[var(--color-blue)] bg-[#f7fbff] p-5 shadow-[0_18px_45px_rgba(29,58,107,0.12)] sm:p-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-blue)]">
              Visual decision board
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal">
              What Ryan is trying to improve.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              The numbers are a plain-English scoring model for the offer, not
              a guarantee. They show what kind of friction this service is meant
              to attack.
            </p>
          </div>
          <div className="grid gap-3">
            {offer.bars.map((bar) => (
              <div key={bar.label} className="rounded-lg border border-[#b8c9e6] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[var(--color-ink)]">
                      {bar.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
                      {bar.caption}
                    </p>
                  </div>
                  <p className="font-mono text-2xl font-black text-[var(--color-ink)]">
                    {bar.value}
                  </p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#d9e2f2]">
                  <div className={`h-full rounded-full ${bar.tone}`} style={{ width: `${bar.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fit-check" className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <OfferDecisionTool
          slug={product.slug}
          name={product.name}
          price={price}
          briefHref={offer.briefHref}
        />
      </section>

      <section className="rrn-section pt-2">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
            What you get
          </p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal sm:text-4xl">
            Concrete pieces, not vague consulting fog.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {offer.deliverables.map((item) => (
            <div key={item.title} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm">
              <h3 className="font-display text-xl font-black tracking-normal">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-line)] bg-[var(--color-ink)] p-5 text-white sm:p-6">
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-support)]">
              Before / after
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal text-white">
              The point is movement.
            </h2>
          </div>
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="border-b border-[var(--color-line)] p-5 lg:border-b-0 lg:border-r sm:p-6">
              <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
                Before
              </p>
              <div className="mt-4 grid gap-3">
                {offer.comparisons.map((item) => (
                  <p key={item.before} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-accent-soft)] p-3 text-sm font-bold leading-relaxed text-[var(--color-ink)]">
                    {item.before}
                  </p>
                ))}
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-normal text-[var(--color-success)]">
                After
              </p>
              <div className="mt-4 grid gap-3">
                {offer.comparisons.map((item) => (
                  <p key={item.after} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-success-soft)] p-3 text-sm font-bold leading-relaxed text-[var(--color-ink)]">
                    {item.after}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rrn-section pt-2">
        <div className="grid gap-4 lg:grid-cols-3">
          {offer.process.map((step, index) => (
            <div key={step.title} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-blue)] font-black text-white">
                {index + 1}
              </span>
              <h2 className="mt-4 font-display text-2xl font-black tracking-normal">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-4 rounded-lg border-2 border-[var(--color-support)] bg-[var(--color-support-soft)] p-5 sm:p-6 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-support-strong)]">
              Answer the real question
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal">
              If this solves the next bottleneck, buy it. If private context
              matters first, send the brief.
            </h2>
          </div>
          <div className="grid gap-2">
            <BuyButton
              slug={product.slug}
              label={`Buy ${product.name} - ${price}`}
              className="w-full rounded-lg bg-[var(--color-support)] px-6 py-4 text-base font-black text-[#1a1410] shadow-[0_12px_28px_rgba(200,155,47,0.3)] transition hover:bg-[#e1b94e] disabled:opacity-60"
            />
            <Link
              href={offer.briefHref}
              className="rrn-tap inline-flex items-center justify-center rounded-lg border-2 border-[var(--color-blue)] bg-white px-5 py-3 text-sm font-black text-[var(--color-blue)] transition hover:bg-[var(--color-blue-soft)]"
            >
              Send Ryan the facts first
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
            Questions
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {offer.faq.map((item) => (
              <div key={item.q} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
                <h3 className="font-display text-xl font-black tracking-normal">
                  {item.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}

function StrategyCallPage({
  product,
  j6Eligible,
}: {
  product: Product;
  j6Eligible: boolean;
}) {
  const price = usd(product.price_cents);
  const pageUrl = `${SITE.url}/store/${product.slug}`;
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: STRATEGY_CALL_TITLE,
    description: STRATEGY_CALL_DESCRIPTION,
    provider: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.url,
    },
    image: `${SITE.url}${STRATEGY_CALL_IMAGE}`,
    offers: {
      "@type": "Offer",
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: pageUrl,
    },
  };

  const fastMoves = [
    {
      title: "I need people to pay me",
      body: "Offer, checkout, invoice, client portal, follow-up, and the page that makes the price make sense.",
      color: "bg-[#fff5d6] border-[#d8ad43]",
    },
    {
      title: "I need a dashboard",
      body: "Admin view, client view, analytics board, intake queue, project tracker, or operator command center.",
      color: "bg-[#e9f2ff] border-[#8eabd7]",
    },
    {
      title: "I need automation",
      body: "Forms, emails, APIs, Supabase, Stripe, OpenAI, webhooks, reminders, and repeatable workflows.",
      color: "bg-[#e8f7ed] border-[#7cc997]",
    },
    {
      title: "I need attention",
      body: "Landing page, funnel, ad angle, story hook, content system, lead magnet, or proof-first sales page.",
      color: "bg-[#ffe8df] border-[#e28b71]",
    },
  ];

  const outcomes = [
    {
      label: "Diagnosis",
      title: "What is actually broken",
      body: "Ryan looks for the friction: unclear offer, weak proof, bad checkout path, missing automation, bad data flow, or the wrong first build.",
    },
    {
      label: "Map",
      title: "What should be built first",
      body: "You leave with a plain-English build map for the dashboard, funnel, tool, API integration, automation, ad, or service page.",
    },
    {
      label: "Recording",
      title: "A replayable source of truth",
      body: "The call is recorded so the details can be replayed while Ryan builds your strategy, quote, software plan, or next action list.",
    },
  ];

  const buildOptions = [
    ["Dashboards", "Client portals, admin views, analytics rooms, lead boards, intake queues, and operator control rooms.", "bg-[#e9f2ff]"],
    ["Tools and software", "Internal tools, public tools, calculators, forms, workflow apps, AI helpers, and custom business software.", "bg-[#f7eafd]"],
    ["Payments and clients", "Checkout paths, service offers, subscriptions, invoices, paid calls, client onboarding, and fulfillment workflows.", "bg-[#fff5d6]"],
    ["APIs and automations", "Supabase, Stripe, Vercel, OpenAI, email, CRM, webhooks, scheduled jobs, and business process automation.", "bg-[#e8f7ed]"],
    ["Ads and funnels", "Landing pages, lead magnets, ad angles, email capture, retargeting paths, offer copy, and conversion tracking.", "bg-[#ffe8df]"],
    ["Content and attention", "Owned-feed strategy, article structure, story hooks, social clips, proof pages, and shareable public receipts.", "bg-[#f0eee4]"],
  ];

  const callFlow = [
    {
      title: "Before the call",
      body: "Bring the problem, the link, the business idea, the messy process, the screenshots, the ads, the funnel, the current site, or the tool you wish existed.",
    },
    {
      title: "During the call",
      body: "Ryan asks direct questions, finds the simplest money path, and identifies what should be built first. The call is recorded so the details do not disappear.",
    },
    {
      title: "After the call",
      body: "The recording is used to help build your strategy, estimate the work, and shape the dashboard, automation, software, funnel, or next move.",
    },
  ];

  const samplePlan = [
    ["Input", "Your idea, site, customer problem, screenshots, current process, links, and what you want people to do."],
    ["Pattern", "Ryan finds the money path, attention hook, missing proof, broken step, tech stack, and smallest useful build."],
    ["Build plan", "You get the dashboard, tool, funnel, automation, checkout, or API path that should be built first."],
  ];

  return (
    <article className="rrn-page bg-[#f8f0df]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />

      <section className="relative overflow-hidden border-b border-[#d8c89e] bg-[linear-gradient(135deg,#fff9e8_0%,#f5ead2_48%,#e8f3ff_100%)]">
        <div className="absolute inset-y-0 right-0 hidden w-[44%] opacity-20 lg:block" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={STRATEGY_CALL_IMAGE}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f8f0df_0%,rgba(248,240,223,0.2)_70%)]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-5 px-4 py-7 sm:px-6 sm:py-9 lg:min-h-[72vh] lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.48fr)] lg:items-center">
          <div className="max-w-4xl">
            <nav className="mb-4 text-sm font-bold text-[var(--color-blue)]">
              <Link href="/store" className="hover:underline">
                &lt;- Store
              </Link>
            </nav>
            <p className="inline-flex rounded-full border border-[#d8ad43] bg-[#fff4c7] px-3 py-1 text-xs font-black uppercase tracking-normal text-[#7a5100]">
              Recorded strategy call / quick build map / real next step
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-black leading-[1.02] tracking-normal text-[var(--color-ink)] sm:text-5xl lg:text-7xl">
              Bring one messy business problem. Leave with the build plan.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-xl">
              Tell Ryan what you are trying to build, sell, automate, fix, or
              explain. He will turn it into a practical strategy for the page,
              dashboard, software, API, funnel, checkout, or tool that should
              come next.
            </p>
            <div className="rrn-tap-row mt-6">
              <a
                href="#book"
                className="rrn-tap inline-flex rounded-lg bg-[var(--color-support)] px-5 py-3 text-sm font-black text-[#1a1410] shadow-[0_10px_24px_rgba(200,155,47,0.3)] transition hover:bg-[#e1b94e]"
              >
                Book the call - {price}
              </a>
              <a
                href="#quick-board"
                className="rrn-tap inline-flex rounded-lg border-2 border-[var(--color-blue)] bg-white/70 px-5 py-3 text-sm font-black text-[var(--color-blue)] transition hover:bg-[var(--color-blue-soft)]"
              >
                See what gets built
              </a>
            </div>
            <div id="pick-problem" className="mt-6 grid gap-3 sm:grid-cols-2">
              {fastMoves.map((move) => (
                <div key={move.title} className={`rounded-lg border-2 ${move.color} p-4`}>
                  <p className="font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                    {move.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {move.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside
            id="book"
            className="rounded-lg border-2 border-[#d8ad43] bg-[#fffdf4] p-5 text-[var(--color-ink)] shadow-[0_22px_60px_rgba(74,62,48,0.16)] lg:sticky lg:top-28"
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-[#e1c775] bg-[#fff5d6]" data-ratio-frame>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STRATEGY_CALL_IMAGE}
                alt="30-minute strategy call thumbnail for Ryan Nichols."
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-normal text-[var(--color-support-strong)]">
              Book the call
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-black leading-tight tracking-normal sm:text-3xl">
                30-Minute Strategy Call
              </h2>
              <p className="shrink-0 text-4xl font-black text-[var(--color-support-strong)]">
                {price}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              The call will be recorded. That recording is used to help build
              your strategy, quote, dashboard, automation, software plan, funnel,
              or next action list.
            </p>
            <div className="mt-5">
              <BuyButton
                slug={product.slug}
                label={`Book the call - ${price}`}
                className="w-full rounded-lg bg-[var(--color-support)] px-6 py-4 text-base font-black text-[#1a1410] shadow-[0_12px_28px_rgba(200,155,47,0.35)] transition hover:bg-[#e1b94e] disabled:opacity-60"
              />
              {j6Eligible ? (
                <J6ClaimButton slug={product.slug} />
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                  J6 defendant?{" "}
                  <Link href="/case" className="font-bold text-[var(--color-accent)] underline">
                    Sign in and link your verified case profile
                  </Link>{" "}
                  to claim eligible services free.
                </p>
              )}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#e1c775] pt-4 text-center text-xs">
              {[
                ["30 min", "focused"],
                ["Recorded", "replayable"],
                ["Stripe", "secure"],
              ].map(([top, bottom]) => (
                <div key={top} className="rounded-lg bg-white p-2">
                  <p className="font-black text-[var(--color-ink)]">{top}</p>
                  <p className="mt-0.5 text-[var(--color-muted)]">{bottom}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="rrn-section">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              What this call does
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal sm:text-4xl">
              It turns vague ideas into something you can actually build, sell,
              or fix.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-soft)]">
              You do not need a perfect brief. You need to explain what you are
              trying to accomplish, what is broken, who the customer is, what
              they should do next, and where the money should flow.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {outcomes.map((item) => (
              <div key={item.label} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-normal text-[var(--color-support-strong)]">
                  {item.label}
                </p>
                <h3 className="mt-2 font-display text-xl font-black tracking-normal">
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

      <section id="quick-board" className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="overflow-hidden rounded-lg border-2 border-[var(--color-blue)] bg-[#f7fbff] shadow-[0_18px_45px_rgba(29,58,107,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[#b8c9e6] bg-[#e9f2ff] p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <p className="text-xs font-black uppercase tracking-normal text-[var(--color-blue)]">
                Sample strategy board
              </p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-normal sm:text-4xl">
                The call becomes a build map.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                This is the kind of structure Ryan is listening for. Your
                details become inputs, patterns, and a concrete first build.
              </p>
            </div>
            <div className="grid gap-3 p-5 sm:p-6">
              {samplePlan.map(([label, body], index) => (
                <div key={label} className="grid gap-3 rounded-lg border border-[#b8c9e6] bg-white p-4 sm:grid-cols-[2.5rem_1fr]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-blue)] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span>
                    <strong className="block text-base font-black text-[var(--color-ink)]">
                      {label}
                    </strong>
                    <span className="mt-1 block text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      {body}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
            What Ryan can help you build
          </p>
          <h2 className="mt-2 max-w-4xl font-display text-3xl font-black tracking-normal sm:text-4xl">
            Dashboards, tools, software, APIs, automations, ads, funnels, and
            the system your business needs to charge clients.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {buildOptions.map(([title, body, color]) => (
              <div key={title} className={`rounded-lg border border-[var(--color-line)] ${color} p-4`}>
                <h3 className="font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rrn-section pt-2">
        <div className="grid gap-4 lg:grid-cols-3">
          {callFlow.map((step) => (
            <div key={step.title} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm">
              <h2 className="font-display text-2xl font-black tracking-normal">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="grid gap-4 rounded-lg border-2 border-[#d8ad43] bg-[#fff8e1] p-5 sm:p-6 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-support-strong)]">
              Good fit if
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal">
              You want the first smart move, not a bloated proposal.
            </h2>
            <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-[var(--color-ink-soft)] sm:grid-cols-2">
              {[
                "You want a dashboard or internal tool but do not know where to start.",
                "You need to charge clients online and make the offer obvious.",
                "You have manual work that should be automated.",
                "You want ads, a funnel, or a landing page that actually explains the offer.",
                "You need APIs connected without turning the business into a tech mess.",
                "You have a story, service, or audience and need a stronger owned platform.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-[#d8ad43] bg-white p-5 shadow-sm">
            <p className="text-5xl font-black tracking-tight text-[var(--color-support-strong)]">
              30
            </p>
            <p className="mt-1 text-sm font-black uppercase tracking-normal text-[var(--color-muted)]">
              minutes recorded
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              The goal is not to solve every business problem in one call. The
              goal is to find the clearest next build, so Ryan can help turn the
              call into a strategy, quote, software plan, dashboard, funnel, or
              automation path.
            </p>
            <div className="mt-5">
              <BuyButton
                slug={product.slug}
                label={`Book the strategy call - ${price}`}
                className="w-full rounded-lg bg-[var(--color-support)] px-6 py-4 text-base font-black text-[#1a1410] shadow-[0_12px_28px_rgba(200,155,47,0.3)] transition hover:bg-[#e1b94e] disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
