"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  { value: "letter", label: "Letter" },
  { value: "email", label: "Email" },
  { value: "photo", label: "Photo" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "spreadsheet", label: "Spreadsheet" },
  { value: "article", label: "Article / analysis" },
];

type State =
  | { kind: "idle" }
  | { kind: "uploading"; label: string; progress?: number }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function CaseUploadForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocType>("other");
  const [docDate, setDocDate] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setState({ kind: "error", message: "Pick a file." });
      return;
    }
    if (!title.trim()) {
      setState({ kind: "error", message: "Give it a title." });
      return;
    }

    setState({ kind: "uploading", label: "Uploading file…" });
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
      const safeBase = slugify(title) || "document";
      const path = `documents/${stamp}-${safeBase}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("case-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
      const { data: pub } = supabase.storage
        .from("case-media")
        .getPublicUrl(path);

      setState({ kind: "uploading", label: "Saving metadata…" });
      const slug = `${slugify(title)}-${stamp.slice(8)}`;
      const { error: insErr } = await supabase.from("case_documents").insert({
        slug,
        title: title.trim(),
        description: description.trim() || null,
        doc_type: docType,
        document_date: docDate || null,
        file_url: pub.publicUrl,
        file_mime: file.type,
        file_size_bytes: file.size,
        source: source.trim() || null,
        visibility,
      });
      if (insErr) throw new Error(`Save failed: ${insErr.message}`);

      setState({ kind: "success", message: "Uploaded. Refreshing…" });
      // Reset the form
      setFile(null);
      setTitle("");
      setDocType("other");
      setDocDate("");
      setDescription("");
      setSource("");
      setVisibility("public");
      setTimeout(() => router.refresh(), 500);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Upload failed.",
      });
    }
  }

  const busy = state.kind === "uploading";
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5"
    >
      <div>
        <label className="block text-sm font-semibold mb-2">File</label>
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/tiff,text/plain"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />
        {file ? (
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {file.name} · {fileSizeMB} MB
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Motion for Reconsideration of Detention Order"
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Document type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Document date <span className="text-[var(--color-muted)] font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={docDate}
            onChange={(e) => setDocDate(e.target.value)}
            className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Description <span className="text-[var(--color-muted)] font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What is this and why does it matter?"
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Source <span className="text-[var(--color-muted)] font-normal">(optional)</span>
        </label>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder='e.g. "US District Court / PACER" or "Personal scan"'
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Visibility</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={[
              "rounded-full px-4 py-1.5 text-xs font-semibold transition border",
              visibility === "public"
                ? "bg-[var(--color-accent)] text-[var(--color-paper)] border-transparent"
                : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            Public
          </button>
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={[
              "rounded-full px-4 py-1.5 text-xs font-semibold transition border",
              visibility === "private"
                ? "bg-[var(--color-accent)] text-[var(--color-paper)] border-transparent"
                : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            Private (admin only)
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn-accent rounded-full px-6 py-2.5 text-sm font-bold disabled:opacity-60"
      >
        {busy ? state.label : "Upload to case archive"}
      </button>

      {state.kind === "error" ? (
        <p className="text-sm text-[var(--color-accent)]">{state.message}</p>
      ) : null}
      {state.kind === "success" ? (
        <p className="text-sm text-emerald-400">{state.message}</p>
      ) : null}
    </form>
  );
}
