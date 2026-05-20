"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Doc = {
  slug: string;
  title: string;
  description: string | null;
  doc_type: string;
  document_date: string | null;
  external_url: string | null;
  file_url: string | null;
  relevance: number;
  transcript: string | null;
  archived: boolean;
  archived_reason: string | null;
  curated_at: string | null;
};

const DOC_TYPES = [
  "filing",
  "court_order",
  "motion",
  "letter",
  "exhibit",
  "media",
  "evidence",
  "transcript",
  "discovery",
  "presidential",
  "other",
];

export function ScanCurator({ doc, nextSlug, prevSlug }: { doc: Doc; nextSlug: string | null; prevSlug: string | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description ?? "");
  const [docType, setDocType] = useState(doc.doc_type);
  const [documentDate, setDocumentDate] = useState(doc.document_date ?? "");
  const [relevance, setRelevance] = useState(doc.relevance);
  const [transcript, setTranscript] = useState(doc.transcript ?? "");
  const [archived, setArchived] = useState(doc.archived);
  const [archivedReason, setArchivedReason] = useState(doc.archived_reason ?? "");
  const [busy, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function save(goNext: boolean) {
    setMsg(null);
    const res = await fetch("/api/admin/case-scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: doc.slug,
        title,
        description: description || null,
        doc_type: docType,
        document_date: documentDate || null,
        relevance,
        transcript: transcript || null,
        archived,
        archived_reason: archived ? archivedReason || null : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error ?? "Save failed");
      return;
    }
    setMsg("Saved.");
    if (goNext && nextSlug) {
      startTransition(() => router.push(`/admin/case/scans?slug=${nextSlug}`));
    } else {
      startTransition(() => router.refresh());
    }
  }

  async function quickArchive(reason: string) {
    setArchived(true);
    setArchivedReason(reason);
    const res = await fetch("/api/admin/case-scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: doc.slug,
        archived: true,
        archived_reason: reason,
      }),
    });
    if (res.ok && nextSlug) {
      startTransition(() => router.push(`/admin/case/scans?slug=${nextSlug}`));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <figure className="rounded-xl overflow-hidden border border-[var(--color-line)] bg-black sticky top-4 self-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/case-doc/${doc.slug}/image`}
          alt={doc.title}
          className="w-full h-auto"
          loading="eager"
        />
        <figcaption className="px-4 py-2 text-xs text-[var(--color-muted)] flex justify-between">
          <span>{doc.slug}</span>
          {doc.external_url ? (
            <a
              href={doc.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] underline"
            >
              Open in Drive →
            </a>
          ) : null}
        </figcaption>
      </figure>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(true);
        }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            {doc.curated_at ? `Curated · ${new Date(doc.curated_at).toLocaleDateString()}` : "Uncurated"}
          </p>
          <div className="flex gap-2 text-xs">
            {prevSlug ? (
              <button
                type="button"
                onClick={() => router.push(`/admin/case/scans?slug=${prevSlug}`)}
                className="rounded border border-[var(--color-line)] px-2 py-1 hover:border-[var(--color-accent)]"
              >
                ← Prev
              </button>
            ) : null}
            {nextSlug ? (
              <button
                type="button"
                onClick={() => router.push(`/admin/case/scans?slug=${nextSlug}`)}
                className="rounded border border-[var(--color-line)] px-2 py-1 hover:border-[var(--color-accent)]"
              >
                Skip →
              </button>
            ) : null}
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">Date</span>
            <input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              className="mt-1 w-full rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">Type</span>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="mt-1 w-full rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            Description (shown publicly)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            Relevance (0 = noise, 5 = central)
          </span>
          <input
            type="range"
            min={0}
            max={5}
            value={relevance}
            onChange={(e) => setRelevance(Number(e.target.value))}
            className="mt-1 w-full"
          />
          <div className="text-sm font-bold">{relevance} / 5</div>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            Transcript / private notes (not public)
          </span>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
            placeholder="OCR of handwriting, key quotes, names mentioned, page-context…"
            className="mt-1 w-full rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </label>

        <div className="rounded-lg border border-[var(--color-line)] p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => setArchived(e.target.checked)}
            />
            Hide from public Documents (keep in DB)
          </label>
          {archived ? (
            <input
              value={archivedReason}
              onChange={(e) => setArchivedReason(e.target.value)}
              placeholder="Reason (duplicate, irrelevant, private, etc.)"
              className="mt-2 w-full rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="btn-accent rounded-lg px-4 py-2 text-sm font-bold"
          >
            Save & Next →
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => save(false)}
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold hover:border-[var(--color-accent)]"
          >
            Save
          </button>
          <span className="flex-1" />
          <button
            type="button"
            disabled={busy}
            onClick={() => quickArchive("duplicate")}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:border-amber-600 hover:text-amber-400"
          >
            Mark duplicate → Next
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => quickArchive("irrelevant")}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:border-amber-600 hover:text-amber-400"
          >
            Irrelevant → Next
          </button>
        </div>

        {msg ? <p className="text-xs text-[var(--color-muted)]">{msg}</p> : null}
      </form>
    </div>
  );
}
