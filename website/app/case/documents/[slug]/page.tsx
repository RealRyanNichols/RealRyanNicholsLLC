import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getDocuments, getDocumentBySlug } from "@/lib/case";
import { ShareButton } from "@/components/ShareButton";
import { CaseStats } from "@/components/CaseStats";
import { CaseViewTracker } from "@/components/CaseViewTracker";
import { SITE } from "@/lib/site";
import { detectVideo } from "@/lib/video";

export const revalidate = 300;

export async function generateStaticParams() {
  const list = await getDocuments();
  return list.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDocumentBySlug(slug);
  if (!d) return { title: "Not found" };
  const url = `${SITE.url}/case/documents/${d.slug}`;
  return {
    title: d.title,
    description: d.description ?? `Document in United States v. Nichols`,
    openGraph: {
      type: "article",
      title: d.title,
      description: d.description ?? undefined,
      url,
    },
    twitter: { card: "summary_large_image", title: d.title, description: d.description ?? undefined },
    alternates: { canonical: url },
  };
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await getDocumentBySlug(slug);
  if (!d) notFound();
  const url = `${SITE.url}/case/documents/${d.slug}`;
  const externalUrl = d.file_url ?? d.external_url;
  const proxiedImage = `/api/case-doc/${d.slug}/image`;
  const video = detectVideo(d.external_url);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <CaseViewTracker type="document" slug={d.slug} />

      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/case" className="hover:underline">
          ← The Case
        </Link>{" "}
        ·{" "}
        <Link href="/case?view=documents" className="hover:underline">
          All documents
        </Link>
      </nav>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
          {d.doc_type}
        </span>
        {d.document_date ? (
          <span className="text-xs text-[var(--color-muted)] font-semibold">
            {format(new Date(d.document_date), "MMMM d, yyyy")}
          </span>
        ) : null}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]">
        {d.title}
      </h1>

      {d.description ? (
        <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
          {d.description}
        </p>
      ) : null}

      {d.source ? (
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Source: {d.source}
        </p>
      ) : null}

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <ShareButton url={url} title={d.title} slug={d.slug} caseKind="document" />
      </div>

      <div className="mt-4">
        <CaseStats views={d.views_count} shares={d.shares_count} />
      </div>

      <figure className="mt-8 rounded-xl overflow-hidden border border-[var(--color-line)] bg-black">
        {video ? (
          <>
            <div className={`relative w-full ${video.kind === "tiktok" ? "aspect-[9/16]" : "aspect-video"}`}>
              <iframe
                src={video.embedUrl}
                title={d.title}
                loading="eager"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-[var(--color-muted)] flex items-center justify-between gap-3 flex-wrap">
              <span>Source: {video.platformLabel}</span>
              <a
                href={video.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] underline font-semibold"
              >
                Open on {video.platformLabel} →
              </a>
            </figcaption>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proxiedImage}
              alt={d.title}
              loading="eager"
              className="w-full h-auto block"
            />
            {externalUrl ? (
              <figcaption className="px-4 py-3 text-xs text-[var(--color-muted)] flex items-center justify-end gap-3 flex-wrap">
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] underline font-semibold"
                >
                  Open source →
                </a>
              </figcaption>
            ) : null}
          </>
        )}
      </figure>

      <div className="mt-10 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-ink-soft)]">
        <Link href="/support" className="text-[var(--color-accent)] underline font-semibold">
          Support Ryan&apos;s rebuild
        </Link>{" "}
        — every dollar funds keeping this record public.
      </div>
    </article>
  );
}
