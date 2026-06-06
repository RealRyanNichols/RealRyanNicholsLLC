import type { Metadata } from "next";
import Link from "next/link";
import { BOOK, BOOK_TIERS, formatUsd, tierSale, type BookTierSlug } from "@/lib/book";
import { SITE } from "@/lib/site";
import { BookBuyButton } from "@/components/BookBuyButton";
import { BookShare } from "@/components/BookShare";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

const title = "Thank You — Fighting Shadows | Ryan Nichols";
const description = "Thank you for your pre-order of Fighting Shadows.";

// Post-purchase page — reads the order, so keep it dynamic and out of search.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/book/thank-you` },
  robots: { index: false, follow: false },
};

const steps = [
  {
    t: "Watch your email",
    b: "A confirmation and your receipt go to the email you used at checkout. Every writing, editing, and printing update comes the same way.",
  },
  {
    t: "Digital editions",
    b: "When the digital edition is ready, it arrives as a secure download link tied to your order — no public file, just yours.",
  },
  {
    t: "Signed copies",
    b: "If you ordered a signed paperback or the Founding Supporter Edition, shipping details will be collected or confirmed before anything is printed and mailed.",
  },
];

// Tier order, used to pick the next edition up as the upsell.
const ORDER: BookTierSlug[] = [
  "early_release_digital",
  "signed_paperback_preorder",
  "founding_supporter_edition",
];

async function purchasedSlug(sessionId?: string): Promise<BookTierSlug | null> {
  if (!sessionId || !isSupabaseServiceConfigured()) return null;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("book_orders")
    .select("product_slug")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  const slug = data?.product_slug as BookTierSlug | undefined;
  return slug && ORDER.includes(slug) ? slug : null;
}

export default async function BookThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const bought = await purchasedSlug(session_id);

  // Upsell the next edition up. If we can't tell what they bought yet (the
  // webhook may not have landed), softly offer the Founding edition — unless
  // they already bought it.
  const idx = bought ? ORDER.indexOf(bought) : -1;
  const upsellSlug =
    idx >= 0 && idx < ORDER.length - 1
      ? ORDER[idx + 1]
      : bought === "founding_supporter_edition"
        ? null
        : "founding_supporter_edition";
  const upsell = upsellSlug
    ? BOOK_TIERS.find((t) => t.slug === upsellSlug)
    : null;
  const upsellSale = upsell ? tierSale(upsell) : { onSale: false, percentOff: 0 };

  return (
    <article className="rrn-page">
      <section className="bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
            {BOOK.title}
          </p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-6xl">
            Thank you. You are on the record.
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-[#cfd9ea] sm:text-lg">
            Your pre-order helps put the full story in public view — and gets it
            to you first. Here is what happens next.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-3">
          {steps.map((s, i) => (
            <div
              key={s.t}
              className="flex gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm"
            >
              <span className="font-mono text-sm font-black text-[var(--color-muted)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                  {s.t}
                </h2>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
                  {s.b}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Upsell — the next edition up */}
        {upsell ? (
          <div className="mt-6 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-5 shadow-md sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
                Make it count more
              </p>
              {upsell.limited ? (
                <span className="rounded-full border border-[var(--color-gold)] bg-[var(--color-gold-soft)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--color-support-strong)]">
                  {upsell.limited} only
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 font-display text-2xl font-black tracking-normal text-[var(--color-ink)]">
              Add the {upsell.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink-soft)]">
              {upsell.tagline}
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              {upsellSale.onSale && upsell.listPriceUsd ? (
                <span className="font-display text-lg font-bold tabular-nums text-[var(--color-muted)] line-through">
                  {formatUsd(upsell.listPriceUsd)}
                </span>
              ) : null}
              <span className="font-display text-3xl font-black tabular-nums text-[var(--color-ink)]">
                {formatUsd(upsell.priceUsd)}
              </span>
            </div>
            <BookBuyButton
              slug={upsell.slug}
              label={`Add it · ${formatUsd(upsell.priceUsd)}`}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--color-accent)] px-5 py-3 text-sm font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
            />
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 sm:p-5">
          <p className="text-sm font-bold leading-relaxed text-[var(--color-ink)]">
            A final release date will be posted once the manuscript, editing, and
            printing schedule is set. I will not promise a date until I can keep
            it.
          </p>
        </div>

        {/* Share — post-purchase is the best moment to spread it */}
        <div className="mt-8 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-center">
          <p className="font-display text-lg font-black text-[var(--color-ink)]">
            Bring someone with you
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink-soft)]">
            The more eyes on the record, the harder it is to bury.
          </p>
          <BookShare
            url={`${SITE.url}/book`}
            text="I just pre-ordered Fighting Shadows by Ryan Nichols — his first-person account of January 6 and the fight to put the record in public view. Get it direct:"
            className="mt-3 justify-center"
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/book/updates"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
          >
            See book updates
          </Link>
          <Link
            href="/book"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)]"
          >
            Back to the book
          </Link>
        </div>
      </section>
    </article>
  );
}
