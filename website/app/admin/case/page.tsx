import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDocuments } from "@/lib/case";
import { CaseUploadForm } from "@/components/CaseUploadForm";

export const metadata: Metadata = {
  title: "Upload case documents",
  robots: { index: false, follow: false },
};

export default async function AdminCasePage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/case");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          You need to be signed in as an admin to upload case documents.
        </p>
      </article>
    );
  }

  const documents = await getDocuments();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Case archive · admin
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight leading-[1.05]">
        Upload case documents
      </h1>
      <p className="mt-3 text-sm text-[var(--color-ink-soft)] max-w-prose leading-relaxed">
        Drag a scan into the form. PDF, JPG, PNG, WebP, HEIC, or TIFF — up to
        100 MB per file. You can do this from your iPhone (Files app → share
        sheet → Safari), your Mac (drag from Finder / iCloud), or any
        computer. Each upload creates a new entry on the /case page.
      </p>

      <div className="mt-8">
        <CaseUploadForm />
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight">
            Existing documents ({documents.length})
          </h2>
          <Link
            href="/case?view=documents"
            className="text-sm font-semibold text-[var(--color-accent)] hover:underline underline-offset-4"
          >
            View public list →
          </Link>
        </div>
        <ul className="space-y-2">
          {documents.slice(0, 15).map((d) => (
            <li
              key={d.id}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{d.title}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {d.doc_type}
                  {d.document_date
                    ? ` · ${format(new Date(d.document_date), "MMM d, yyyy")}`
                    : ""}
                </p>
              </div>
              <a
                href={d.file_url ?? d.external_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[var(--color-accent)] hover:underline whitespace-nowrap"
              >
                Open
              </a>
            </li>
          ))}
        </ul>
        {documents.length > 15 ? (
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Showing the 15 most recent. {documents.length - 15} more on /case.
          </p>
        ) : null}
      </section>
    </article>
  );
}
