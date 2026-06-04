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
