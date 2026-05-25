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
