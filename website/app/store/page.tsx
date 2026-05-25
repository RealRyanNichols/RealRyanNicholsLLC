import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Store — hire me, support the work",
  description:
    "Hire Ryan Nichols to build, investigate, or tell your story — plus signed letters and prints. Every purchase funds keeping the record public.",
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

export default async function StorePage() {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("products")
    .select("slug, name, description, image_url, price_cents, type")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const products = (data ?? []) as Product[];

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
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
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link
              key={p.slug}
              href={`/store/${p.slug}`}
              className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-accent)] transition"
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="h-40 w-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] text-xs uppercase tracking-wider">
                  {p.type}
                </div>
              )}
              <div className="p-4">
                <h2 className="text-base font-bold tracking-tight group-hover:text-[var(--color-accent)]">
                  {p.name}
                </h2>
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
          ))}
        </div>
      )}
    </article>
  );
}
