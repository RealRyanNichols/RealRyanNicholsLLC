import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getDocuments } from "@/lib/case";
import { ShareButton } from "@/components/ShareButton";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const list = await getDocuments();
  return list.map((d) => ({ slug: d.slug }));
}

async function getDocumentBySlug(slug: string) {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_documents")
    .select("id, slug, title, description, doc_type, document_date, file_url, external_url, source")
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();
  return data;
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
  const fileUrl = d.file_url ?? d.external_url;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
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
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent inline-flex items-center rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Open document →
          </a>
        ) : (
          <span className="text-sm text-[var(--color-muted)] italic">
            File not yet uploaded.
          </span>
        )}
        <ShareButton url={url} title={d.title} />
      </div>

      <div className="mt-10 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-ink-soft)]">
        <Link href="/support" className="text-[var(--color-accent)] underline font-semibold">
          Support Ryan's rebuild
        </Link>{" "}
        — every dollar funds keeping this record public.
      </div>
    </article>
  );
}
