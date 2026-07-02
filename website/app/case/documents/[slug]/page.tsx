import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getDocuments, getDocumentBySlug } from "@/lib/case";
import { ShareButton } from "@/components/ShareButton";
import { CaseStats } from "@/components/CaseStats";
import { CaseViewTracker } from "@/components/CaseViewTracker";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/jsonld";
import { SITE } from "@/lib/site";
import { detectVideo } from "@/lib/video";
import { EvidenceBadge } from "@/components/EvidenceBadge";

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
  const description = d.description ?? `Document in United States v. Nichols`;
  const ogUrl = `${SITE.url}/og/document/${d.slug}`;
  const ogImages = [
    { url: ogUrl, width: 1200, height: 630, alt: d.title },
  ];
  return {
    title: d.title,
    description,
    openGraph: {
      type: "article",
      title: d.title,
      description,
      url,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: d.title,
      description,
      images: [ogUrl],
    },
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
      <JsonLd
        data={breadcrumbLd([
          { name: "The J6 Case", url: `${SITE.url}/case` },
          { name: "Documents", url: `${SITE.url}/case?view=documents` },
          { name: d.title, url },
        ])}
      />

      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/case" className="hover:underline">
          ← J6 Case
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
        <EvidenceBadge kind={d.doc_type} />
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
        ) : !d.file_url && d.external_url ? (
          // Official records we deliberately do NOT re-host (court filings on
          // CourtListener/RECAP): embed the PDF straight from the source, with
          // a graceful hand-off if the browser won't inline it.
          <>
            <object
              data={d.external_url}
              type="application/pdf"
              className="block h-[75vh] w-full bg-white"
            >
              <div className="flex h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="max-w-md text-sm leading-relaxed text-white/85">
                  This is an official court record, served directly from the
                  public docket so you can verify it at the source.
                </p>
                <a
                  href={d.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-[#fdf8ea] px-5 py-2.5 text-sm font-bold text-[var(--color-navy)]"
                >
                  Open the PDF →
                </a>
              </div>
            </object>
            <figcaption className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-[var(--color-muted)]">
              <span>Official record · not re-hosted — verify at the source</span>
              <a
                href={d.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-accent)] underline"
              >
                Open at the source →
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
        This record stays public because the work sells, not begs —{" "}
        <Link href="/book" className="text-[var(--color-accent)] underline font-semibold">
          get the book
        </Link>{" "}
        or{" "}
        <Link href="/case-builder" className="text-[var(--color-accent)] underline font-semibold">
          get your own case built like this
        </Link>
        .
      </div>
    </article>
  );
}
