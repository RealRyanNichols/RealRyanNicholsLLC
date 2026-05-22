import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OgImageForm } from "@/components/OgImageForm";
import { OgImageDeleteButton } from "@/components/OgImageDeleteButton";

export const metadata: Metadata = {
  title: "OG images",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const SUGGESTED_PATHS: { path: string; label: string }[] = [
  { path: "/", label: "Homepage / feed" },
  { path: "/case", label: "The J6 Case (landing)" },
  { path: "/case?filter=unclaimed&view=people", label: "/case — Unclaimed J6 profiles" },
  { path: "/case?filter=verified&view=people", label: "/case — Verified J6 profiles" },
  { path: "/case?view=documents", label: "/case — Documents tab" },
  { path: "/case?view=grievances", label: "/case — Grievances tab" },
  { path: "/case?view=timeline", label: "/case — Timeline tab" },
  { path: "/j6", label: "/j6 — Mission page" },
  { path: "/submit", label: "/submit — Tip line" },
  { path: "/about", label: "/about" },
];

export default async function AdminOgImagesPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/og-images");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const { data: rows } = await supabase
    .from("page_og_images")
    .select("path, image_url, title, description, width, height, updated_at")
    .order("updated_at", { ascending: false });
  const images = rows ?? [];

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · social share images
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        OG images per page
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-2xl leading-relaxed">
        Upload the image that shows up when a page is shared on Twitter, Facebook,
        iMessage, etc. Match the path exactly — query string and all. Recommended
        size: <strong>1200×630</strong> for landscape share cards.
      </p>

      <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight mb-3">Upload a new image</h2>
        <OgImageForm suggestedPaths={SUGGESTED_PATHS} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight mb-3">
          Currently configured ({images.length})
        </h2>
        {images.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic py-6">
            No OG images uploaded yet. Pages fall back to the global default.
          </p>
        ) : (
          <div className="space-y-3">
            {images.map((row) => (
              <article
                key={row.path}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-shrink-0 w-full sm:w-48">
                  <a
                    href={row.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-[1200/630] relative rounded-lg overflow-hidden bg-[var(--color-paper)] border border-[var(--color-line-soft)]"
                  >
                    <Image
                      src={row.image_url}
                      alt={row.title ?? row.path}
                      fill
                      sizes="200px"
                      className="object-cover"
                      unoptimized
                    />
                  </a>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
                    Path
                  </p>
                  <p className="font-mono text-sm break-all">{row.path}</p>
                  {row.title ? (
                    <p className="mt-2 text-sm font-semibold">{row.title}</p>
                  ) : null}
                  {row.description ? (
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                      {row.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Updated{" "}
                    <span title={format(new Date(row.updated_at), "yyyy-MM-dd HH:mm:ss")}>
                      {formatDistanceToNowStrict(new Date(row.updated_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <Link
                      href={row.path}
                      target="_blank"
                      className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      Preview page →
                    </Link>
                    <OgImageDeleteButton path={row.path} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        <Link href="/admin" className="underline">
          ← Admin dashboard
        </Link>
      </p>
    </article>
  );
}
