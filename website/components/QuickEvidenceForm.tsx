"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DOC_TYPES = [
  { value: "article", label: "Article / blog post" },
  { value: "video", label: "Video / clip" },
  { value: "photo", label: "Photo / screenshot" },
  { value: "audio", label: "Audio / podcast" },
  { value: "transcript", label: "Transcript / testimony" },
  { value: "letter", label: "Letter / press release" },
  { value: "exhibit", label: "Exhibit" },
  { value: "indictment", label: "Indictment" },
  { value: "motion", label: "Motion" },
  { value: "order", label: "Court order" },
  { value: "ruling", label: "Ruling / opinion" },
  { value: "affidavit", label: "Affidavit" },
  { value: "other", label: "Other" },
];

const AUTHOR_ROLES = [
  { value: "evidence", label: "Evidence / on-the-record statement" },
  { value: "media", label: "Media / press / podcast" },
  { value: "government", label: "Government / agency" },
  { value: "court", label: "Court" },
  { value: "attorney", label: "Attorney / legal filing" },
  { value: "co_detainee", label: "Co-detainee" },
  { value: "family", label: "Family member" },
  { value: "ryan", label: "Ryan" },
  { value: "other", label: "Other" },
];

const THEMES = [
  { value: "entrapment", label: "🪤 Entrapment" },
  { value: "excessive_force", label: "💥 Excessive force" },
  { value: "death_or_injury", label: "🏥 Death / injury" },
  { value: "police_misconduct", label: "🚓 Police misconduct" },
  { value: "government_lies", label: "🤥 Government lies" },
  { value: "contradiction", label: "🔁 Contradictions" },
  { value: "due_process", label: "⚖️ Due process" },
  { value: "abuse_in_custody", label: "🔒 Abuse in custody" },
];

type Result = {
  document_id: string;
  slug: string;
  public_url: string;
  themes: string[];
  importance: number;
  linked: { person: boolean; event: boolean; grievances: number };
};

export function QuickEvidenceForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<Result | null>(null);

  // Form state
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [docType, setDocType] = useState("article");
  const [authorRole, setAuthorRole] = useState("evidence");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [personSlug, setPersonSlug] = useState("");
  const [eventSlug, setEventSlug] = useState("");
  const [grievanceSlugs, setGrievanceSlugs] = useState("");
  const [themes, setThemes] = useState<Set<string>>(new Set());
  const [relevance, setRelevance] = useState(3);

  function toggleTheme(t: string) {
    setThemes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    setDone(null);
    try {
      const res = await fetch("/api/admin/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || null,
          title: title.trim(),
          body: body.trim() || null,
          source_label: sourceLabel.trim() || null,
          document_date: documentDate || null,
          doc_type: docType,
          author_role: authorRole,
          thumbnail_url: thumbnailUrl.trim() || null,
          person_slug: personSlug.trim() || null,
          event_slug: eventSlug.trim() || null,
          grievance_slugs: grievanceSlugs.trim() || null,
          themes: [...themes],
          relevance,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as
        | (Result & { ok: true })
        | { error?: string };
      if (!res.ok) {
        setErr(("error" in j && j.error) || "Could not save.");
        return;
      }
      setDone(j as Result);
      router.refresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setUrl("");
    setTitle("");
    setBody("");
    setSourceLabel("");
    setDocumentDate("");
    setDocType("article");
    setAuthorRole("evidence");
    setThumbnailUrl("");
    setPersonSlug("");
    setEventSlug("");
    setGrievanceSlugs("");
    setThemes(new Set());
    setRelevance(3);
    setDone(null);
  }

  if (done) {
    return (
      <div className="rounded-xl border-2 border-[var(--color-success)] bg-[var(--color-surface)] p-5">
        <h2 className="text-xl font-bold tracking-tight">✓ Locked in.</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Live on the site at{" "}
          <a
            href={done.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] underline font-semibold"
          >
            {done.public_url}
          </a>
        </p>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Themes: {done.themes.length > 0 ? done.themes.join(", ") : "(none)"} ·
          importance {done.importance} · linked:{" "}
          {done.linked.person ? "person ✓ " : ""}
          {done.linked.event ? "event ✓ " : ""}
          {done.linked.grievances > 0
            ? `${done.linked.grievances} grievance${done.linked.grievances === 1 ? "" : "s"} ✓`
            : ""}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-[var(--color-accent)] text-[var(--color-paper)] px-4 py-2 text-sm font-bold"
          >
            + Add another
          </button>
          <a
            href={done.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-4 py-2 text-sm font-semibold"
          >
            View on site →
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field
        label="Source URL"
        hint="Where it came from — tweet URL, news link, video link. Optional but recommended."
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://x.com/ChiefSund/status/..."
          className={input}
        />
      </Field>

      <Field label="Title" hint="What people see in the evidence grid." required>
        <input
          required
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={250}
          placeholder='e.g. "Chief Sund: Pelosi denied my National Guard request"'
          className={input}
        />
      </Field>

      <Field
        label="Body / verbatim quote"
        hint="The exact text from the tweet/article/clip. This is what makes it searchable."
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="Paste the full quote here."
          className={`${input} font-sans resize-y`}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Source label" hint='e.g. "@ChiefSund on X" or "Tucker Carlson, June 2024"'>
          <input
            type="text"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            className={input}
          />
        </Field>
        <Field label="Document date" hint="When was it published?">
          <input
            type="date"
            value={documentDate}
            onChange={(e) => setDocumentDate(e.target.value)}
            className={input}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Document type">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className={input}
          >
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Author role" hint="Who's saying this?">
          <select
            value={authorRole}
            onChange={(e) => setAuthorRole(e.target.value)}
            className={input}
          >
            {AUTHOR_ROLES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Thumbnail URL"
        hint="Optional — if you uploaded a screenshot via /admin/og-images, paste its public URL here. Renders inline on the doc page."
      >
        <input
          type="url"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          className={input}
        />
      </Field>

      <fieldset className="border border-[var(--color-line)] rounded-lg p-4">
        <legend className="px-2 text-xs uppercase tracking-wider font-bold text-[var(--color-muted)]">
          Attach to (by slug)
        </legend>
        <div className="grid grid-cols-1 gap-3">
          <Field
            label="Person slug"
            hint='e.g. "ryan-nichols" — what comes after /case/people/ in the URL'
          >
            <input
              type="text"
              value={personSlug}
              onChange={(e) => setPersonSlug(e.target.value)}
              placeholder="ryan-nichols"
              className={`${input} font-mono`}
            />
          </Field>
          <Field label="Event slug" hint='e.g. "brasher-denial-pre-plea"'>
            <input
              type="text"
              value={eventSlug}
              onChange={(e) => setEventSlug(e.target.value)}
              placeholder="brasher-denial-pre-plea"
              className={`${input} font-mono`}
            />
          </Field>
          <Field
            label="Grievance slugs"
            hint='Comma-separated. e.g. "constitutional-right-violations, brady-violations-suppressed-informant"'
          >
            <input
              type="text"
              value={grievanceSlugs}
              onChange={(e) => setGrievanceSlugs(e.target.value)}
              placeholder="constitutional-right-violations"
              className={`${input} font-mono`}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs uppercase tracking-wider font-bold text-[var(--color-muted)] mb-2">
          Evidence themes
        </legend>
        <p className="text-xs text-[var(--color-ink-soft)] mb-2">
          Auto-detected themes from the body text get added automatically. Tick
          any extra ones that apply.
        </p>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <label
              key={t.value}
              className={[
                "rounded-full border px-3 py-1 text-xs font-bold cursor-pointer transition select-none",
                themes.has(t.value)
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)]"
                  : "border-[var(--color-line)] hover:border-[var(--color-accent)]",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={themes.has(t.value)}
                onChange={() => toggleTheme(t.value)}
                className="hidden"
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Relevance (0-5)" hint="Where it ranks in the evidence grid. 5 is top.">
        <input
          type="number"
          min={0}
          max={5}
          value={relevance}
          onChange={(e) => setRelevance(Number(e.target.value))}
          className={`${input} max-w-[100px]`}
        />
      </Field>

      {err ? (
        <p className="rounded-md bg-[var(--color-accent-soft)] border border-[var(--color-accent)] px-3 py-2 text-sm text-[var(--color-accent)]">
          {err}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-6 py-3 font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
      >
        {busy ? "Locking in…" : "Lock in evidence →"}
      </button>
    </form>
  );
}

const input =
  "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent)]";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1.5">
        {label}
        {required ? <span className="text-[var(--color-accent)] ml-1">*</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
