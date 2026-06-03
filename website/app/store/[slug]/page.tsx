import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { BuyButton } from "@/components/BuyButton";
import { J6ClaimButton } from "@/components/J6ClaimButton";

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

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/store" className="hover:underline">
          ← Store
        </Link>
      </nav>
      {p.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.image_url}
          alt={p.name}
          className="w-full rounded-2xl border border-[var(--color-line)] mb-6"
        />
      ) : null}
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        {p.type}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        {p.name}
      </h1>
      <p className="mt-3 text-2xl font-bold text-[var(--color-accent)]">
        {usd(p.price_cents)}
      </p>
      {p.description ? (
        <p className="mt-5 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap">
          {p.description}
        </p>
      ) : null}

      <div className="mt-8 max-w-sm">
        <BuyButton slug={p.slug} label={`Buy — ${usd(p.price_cents)}`} />
        {j6Eligible ? (
          <J6ClaimButton slug={p.slug} />
        ) : (
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            J6 defendant?{" "}
            <Link href="/case" className="text-[var(--color-accent)] underline">
              Sign in and link your verified case profile
            </Link>{" "}
            to claim this free.
          </p>
        )}
      </div>
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

  const outcomes = [
    "A direct diagnosis of what is costing you attention, leads, trust, money, or time.",
    "A clear strategy for the next build: dashboard, funnel, website, automation, tool, ad, offer, or API integration.",
    "A recorded call Ryan can replay while building your plan, quote, dashboard, software, or next action list.",
  ];

  const buildOptions = [
    ["Dashboards", "Client portals, admin views, analytics rooms, lead boards, intake queues, and operator control rooms."],
    ["Tools and software", "Internal tools, public tools, calculators, forms, workflow apps, AI helpers, and custom business software."],
    ["Payments and clients", "Checkout paths, service offers, subscriptions, invoices, paid calls, client onboarding, and fulfillment workflows."],
    ["APIs and automations", "Supabase, Stripe, Vercel, OpenAI, email, CRM, webhooks, scheduled jobs, and business process automation."],
    ["Ads and funnels", "Landing pages, lead magnets, ad angles, email capture, retargeting paths, offer copy, and conversion tracking."],
    ["Content and attention", "Owned-feed strategy, article structure, story hooks, social clips, proof pages, and shareable public receipts."],
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

  return (
    <article className="rrn-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />

      <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-[#100805] text-[#fdf8ea]">
        <div className="absolute inset-0" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={STRATEGY_CALL_IMAGE}
            alt=""
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,8,5,0.96)_0%,rgba(16,8,5,0.84)_42%,rgba(16,8,5,0.22)_100%)]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[76vh] lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.72fr)] lg:items-end">
          <div className="max-w-3xl">
            <nav className="mb-5 text-sm text-[#d8c89e]">
              <Link href="/store" className="hover:underline">
                &lt;- Store
              </Link>
            </nav>
            <p className="inline-flex rounded-full border border-[#d8c89e]/50 bg-[#fdf8ea]/10 px-3 py-1 text-xs font-black uppercase tracking-normal text-[#f1c15f]">
              Recorded 30-minute strategy call
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-[1.02] tracking-normal text-[#fdf8ea] sm:text-5xl lg:text-7xl">
              Stop guessing what to build next.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#f6efdf] sm:text-xl">
              Get on a focused call with Ryan and turn the problem into a real
              strategy: what to build, what to sell, what to automate, what to
              charge for, and what should happen next.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {[
                ["Recorded", "So the strategy can be replayed and used."],
                ["Direct", "No corporate fog. Plain next moves."],
                ["Build-minded", "Dashboard, software, funnels, automations."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-[#d8c89e]/30 bg-[#fdf8ea]/10 p-3">
                  <p className="font-black text-[#fdf8ea]">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#f6efdf]/80">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d8c89e]/50 bg-[#fdf8ea] p-5 text-[var(--color-ink)] shadow-2xl">
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Book the call
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-black tracking-normal">
                {product.name}
              </h2>
              <p className="shrink-0 text-4xl font-black text-[var(--color-accent)]">
                {price}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              The call will be recorded. That recording is used to help build
              your strategy, capture the details, and keep the next steps clear.
            </p>
            <div className="mt-5">
              <BuyButton
                slug={product.slug}
                label={`Book the call - ${price}`}
                className="btn-accent w-full rounded-lg px-6 py-4 text-base font-black transition disabled:opacity-60"
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
            <div className="mt-5 border-t border-[var(--color-line)] pt-4">
              <p className="text-xs font-black uppercase tracking-normal text-[var(--color-muted)]">
                Best for
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                Business owners, creators, service providers, advocates, and
                operators who need a real plan before spending money on a bigger
                build.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rrn-section">
        <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              What this call is
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal sm:text-4xl">
              A recorded strategy session for the business you are trying to
              build.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-soft)]">
              You do not need a perfect brief. You need to explain what you are
              trying to accomplish, what is broken, what you want people to do,
              and where the money should flow. Ryan turns that into a buildable
              strategy.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {outcomes.map((item, index) => (
              <div key={item} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                <p className="text-sm font-black uppercase tracking-normal text-[var(--color-accent)]">
                  Outcome {index + 1}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-ink)] p-5 text-white sm:p-7">
          <p className="text-xs font-black uppercase tracking-normal text-[#7fe3a9]">
            What Ryan can help you build
          </p>
          <h2 className="mt-2 max-w-3xl font-display text-3xl font-black tracking-normal text-white sm:text-4xl">
            Dashboards, tools, software, APIs, automations, ads, funnels, and
            the system your business needs to charge clients.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {buildOptions.map(([title, body]) => (
              <div key={title} className="rounded-lg border border-white/15 bg-white/6 p-4">
                <h3 className="font-display text-xl font-black tracking-normal text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
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
            <div key={step.title} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
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
        <div className="grid gap-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
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
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
            <p className="text-5xl font-black tracking-tight text-[var(--color-accent)]">
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
                className="btn-accent w-full rounded-lg px-6 py-4 text-base font-black transition disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
