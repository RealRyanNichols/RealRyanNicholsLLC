import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// {{related: slug-one | slug-two | slug-three}} — internal backlinks rendered
// inline mid-article, where they keep a reader moving through the archive
// instead of leaving. Max three; unpublished or unknown slugs skip silently.

type RelatedRow = {
  slug: string;
  title: string | null;
  og_image_url: string | null;
  thumbnail_url: string | null;
  seo_description: string | null;
};

export async function RelatedPosts({ slugs }: { slugs: string[] }) {
  const wanted = slugs.map((s) => s.trim()).filter(Boolean).slice(0, 3);
  if (wanted.length === 0) return null;

  let rows: RelatedRow[] = [];
  try {
    const supabase = getSupabaseStaticClient();
    const { data } = await supabase
      .from("posts")
      .select("slug, title, og_image_url, thumbnail_url, seo_description")
      .in("slug", wanted)
      .eq("status", "published");
    rows = (data ?? []) as RelatedRow[];
  } catch {
    return null; // never break the article over a related rail
  }
  if (rows.length === 0) return null;

  // Preserve the author's ordering.
  const ordered = wanted
    .map((s) => rows.find((r) => r.slug === s))
    .filter((r): r is RelatedRow => Boolean(r));

  return (
    <aside className="not-prose my-8 rounded-lg border border-[#0b1b34]/20 bg-[var(--color-surface)] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-navy)]">
        From the archive
      </p>
      <div
        className={[
          "mt-3 grid gap-3",
          ordered.length === 2 ? "sm:grid-cols-2" : "",
          ordered.length >= 3 ? "sm:grid-cols-3" : "",
        ].join(" ")}
      >
        {ordered.map((r) => {
          const img = r.og_image_url ?? r.thumbnail_url;
          return (
            <Link
              key={r.slug}
              href={`/posts/${r.slug}`}
              className="group overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] no-underline transition hover:border-[var(--color-navy)]"
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  width={600}
                  height={315}
                  className="aspect-[1200/630] w-full object-cover"
                />
              ) : null}
              <span className="block p-3">
                <span className="block text-sm font-black leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-navy)]">
                  {r.title ?? r.slug}
                </span>
                {r.seo_description ? (
                  <span className="mt-1 line-clamp-2 block text-xs leading-snug text-[var(--color-ink-soft)]">
                    {r.seo_description}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
