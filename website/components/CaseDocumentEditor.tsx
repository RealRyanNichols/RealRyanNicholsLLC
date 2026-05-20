"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type DocType =
  | "motion"
  | "order"
  | "ruling"
  | "transcript"
  | "indictment"
  | "affidavit"
  | "docket"
  | "exhibit"
  | "discovery"
  | "grievance_form"
  | "letter"
  | "email"
  | "photo"
  | "audio"
  | "video"
  | "spreadsheet"
  | "article"
  | "other";

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "other", label: "Other" },
  { value: "motion", label: "Motion" },
  { value: "order", label: "Court order" },
  { value: "ruling", label: "Ruling" },
  { value: "transcript", label: "Transcript" },
  { value: "indictment", label: "Indictment" },
  { value: "affidavit", label: "Affidavit" },
  { value: "docket", label: "Docket entry" },
  { value: "exhibit", label: "Exhibit" },
  { value: "discovery", label: "Discovery" },
  { value: "grievance_form", label: "Grievance form" },
  { value: "letter", label: "Letter / cell note" },
  { value: "email", label: "Email" },
  { value: "photo", label: "Photo" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "spreadsheet", label: "Spreadsheet" },
  { value: "article", label: "Article / analysis" },
];

type Doc = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  doc_type: string;
  document_date: string | null;
  file_url: string | null;
  external_url: string | null;
  visibility: string;
};

export function CaseDocumentEditor({ documents }: { documents: Doc[] }) {
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = documents.filter((d) => {
    if (typeFilter !== "all" && d.doc_type !== typeFilter) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.description ?? "").toLowerCase().includes(q) ||
      d.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search title, description, slug…"
          className="flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-3 text-xs text-[var(--color-muted)]">
        Showing {filtered.length} of {documents.length}
      </p>

      <ul className="space-y-2">
        {filtered.map((d) => (
          <DocumentRow key={d.id} doc={d} />
        ))}
        {filtered.length === 0 ? (
          <li className="text-sm text-[var(--color-muted)] italic">
            No documents match.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function DocumentRow({ doc }: { doc: Doc }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState(doc.title);
  const [docType, setDocType] = useState(doc.doc_type);
  const [docDate, setDocDate] = useState(doc.document_date ?? "");
  const [description, setDescription] = useState(doc.description ?? "");
  const [visibility, setVisibility] = useState(doc.visibility);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("case_documents")
        .update({
          title: title.trim() || "Untitled",
          doc_type: docType,
          document_date: docDate || null,
          description: description.trim() || null,
          visibility,
        })
        .eq("id", doc.id);
      if (error) throw new Error(error.message);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setBusy(true);
    setErr(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("case_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-[var(--color-accent)] bg-[var(--color-surface)] p-4 space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold block mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold block mb-1">Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold block mb-1">Date</label>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold block mb-1">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold block mb-1">Visibility</label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={[
                "rounded-full px-3 py-1 text-xs font-bold border",
                visibility === "public"
                  ? "bg-[var(--color-accent)] text-[#0a0a0c] border-transparent"
                  : "border-[var(--color-line)] text-[var(--color-ink-soft)]",
              ].join(" ")}
            >Public</button>
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={[
                "rounded-full px-3 py-1 text-xs font-bold border",
                visibility === "private"
                  ? "bg-[var(--color-accent)] text-[#0a0a0c] border-transparent"
                  : "border-[var(--color-line)] text-[var(--color-ink-soft)]",
              ].join(" ")}
            >Private</button>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="btn-accent rounded-full px-4 py-1.5 text-xs font-bold disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={busy}
            className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Cancel
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={del}
            disabled={busy}
            className="rounded-full bg-red-800 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            Delete
          </button>
        </div>
        {err ? <p className="text-xs text-red-400">{err}</p> : null}
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-accent)]">
            {doc.doc_type}
          </span>
          {doc.document_date ? (
            <span className="text-[10px] text-[var(--color-muted)]">
              {format(new Date(doc.document_date), "MMM d, yyyy")}
            </span>
          ) : null}
          {doc.visibility === "private" ? (
            <span className="text-[10px] rounded-full bg-amber-900/30 border border-amber-700 text-amber-300 px-1.5 py-0.5 uppercase tracking-wider font-bold">
              private
            </span>
          ) : null}
        </div>
        <p className="text-sm font-semibold truncate mt-0.5">{doc.title}</p>
        {doc.description ? (
          <p className="text-xs text-[var(--color-muted)] truncate">
            {doc.description}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-semibold text-[var(--color-accent)] hover:underline whitespace-nowrap"
        >
          Edit
        </button>
        <a
          href={doc.file_url ?? doc.external_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] whitespace-nowrap"
        >
          Open
        </a>
      </div>
    </li>
  );
}
