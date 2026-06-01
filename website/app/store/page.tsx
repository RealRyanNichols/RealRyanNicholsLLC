import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Store — hire me, support the work",
  description:
    "Hire Ryan Nichols to build your owned feed, audit your site, or map your next move — plus prints and digital downloads. Every purchase keeps the record public.",
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
    label: "Services",
    blurb: "Hire me directly — calls, audits, and owned-feed builds.",
  },
  { type: "digital", label: "Digital", blurb: "Downloads and templates you keep." },
  {
    type: "physical",
    label: "Prints & physical",
    blurb: "Signed, tangible, shipped to your door.",
  },
];

function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      href={`/store/${p.slug}`}
      className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-accent)] transition"
    >
      {p.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image_url} alt={p.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] text-xs uppercase tracking-wider">
          {p.type}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-base font-bold tracking-tight group-hover:text-[var(--color-accent)]">
          {p.name}
        </h3>
        {p.description ? (
          <p className="mt-1 text-sm text-[var(--color-ink-soft)] line-clamp-2">
            {p.description}
          </p>
        ) : null}
        <p className="mt-3 text-lg font-bold text-[var(--color-accent)]">
          {usd(p.price_cents)}
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
    name: "Ryan Nichols — store",
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
    <article className="mx-auto max-w-5xl px-4 py-10">
      {products.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      ) : null}

      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        The store
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">
        Hire me. Support the work.
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)] leading-relaxed">
        Everything here funds the same fight — keeping the record public and the
        lights on. Want me to build, investigate, or tell your story? That&apos;s
        what this is.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          [
            "Card today, crypto soon",
            "Secure card checkout through Stripe now. Stablecoin payments are being added.",
          ],
          [
            "What happens after you buy",
            "You get a receipt by email, then we schedule or I start the work.",
          ],
          [
            "J6 defendants",
            "Verified January 6 defendants claim eligible services free.",
          ],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-sm font-bold text-[var(--color-ink)]">{k}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{v}</p>
          </div>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-[var(--color-ink-soft)]">
          The store is opening soon. In the meantime,{" "}
          <Link
            href="/support"
            className="text-[var(--color-accent)] underline underline-offset-4"
          >
            support the work here
          </Link>
          .
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          {groups.map((group) => (
            <section key={group.type}>
              <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] pb-2">
                <h2 className="text-xl font-bold tracking-tight">{group.label}</h2>
                {group.blurb ? (
                  <p className="hidden text-sm text-[var(--color-muted)] sm:block">
                    {group.blurb}
                  </p>
                ) : null}
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((p) => (
                  <ProductCard key={p.slug} p={p} />
                ))}
              </div>
            </section>
          ))}

          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Not sure which one you need?
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                See how the owned-feed build works end to end, or start with the
                30-minute call.
              </p>
            </div>
            <div className="flex flex-none flex-col gap-2 sm:flex-row">
              <Link
                href="/own-your-feed"
                className="btn-blue inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold"
              >
                How it works
              </Link>
              <Link
                href="/store/strategy-call-30"
                className="btn-accent inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold"
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
