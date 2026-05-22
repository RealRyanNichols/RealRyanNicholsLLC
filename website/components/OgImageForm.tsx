"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = { path: string; label: string };

type Status = "idle" | "uploading" | "ok" | "error";

export function OgImageForm({ suggestedPaths }: { suggestedPaths: Suggestion[] }) {
  const router = useRouter();
  const [path, setPath] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "uploading") return;
    if (!file) {
      setStatus("error");
      setMsg("Pick a file first.");
      return;
    }
    if (!path.trim()) {
      setStatus("error");
      setMsg("Path is required.");
      return;
    }

    setStatus("uploading");
    setMsg(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("path", path.trim());
    if (title.trim()) fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());

    try {
      const res = await fetch("/api/admin/og-images", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMsg(json.error ?? "Upload failed.");
        return;
      }
      setStatus("ok");
      setMsg("Saved.");
      setPath("");
      setTitle("");
      setDescription("");
      setFile(null);
      const fileInput = document.getElementById("og-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      router.refresh();
    } catch {
      setStatus("error");
      setMsg("Network error.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="og-path" className="block text-sm font-semibold mb-1.5">
          Page path <span className="text-[var(--color-accent)]">*</span>
        </label>
        <input
          id="og-path"
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/case?view=people&filter=unclaimed"
          required
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-base font-mono focus:outline-none focus:border-[var(--color-accent)]"
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Must start with /. Include the full query string so that exact URL
          gets this image.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestedPaths.map((s) => (
            <button
              key={s.path}
              type="button"
              onClick={() => setPath(s.path)}
              className="text-[10px] font-semibold rounded-full border border-[var(--color-line)] px-2.5 py-1 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
              title={s.path}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="og-file" className="block text-sm font-semibold mb-1.5">
          Image <span className="text-[var(--color-accent)]">*</span>
        </label>
        <input
          id="og-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
          className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-accent)] file:text-[var(--color-paper)] file:font-bold file:px-3 file:py-1.5 file:hover:bg-[var(--color-accent-strong)]"
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          PNG, JPEG, WEBP, or GIF. Recommended 1200×630. Max 8MB.
        </p>
      </div>

      <div>
        <label htmlFor="og-title" className="block text-sm font-semibold mb-1.5">
          Override title (optional)
        </label>
        <input
          id="og-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Leave blank to use the page's existing title"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div>
        <label htmlFor="og-desc" className="block text-sm font-semibold mb-1.5">
          Override description (optional)
        </label>
        <textarea
          id="og-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Leave blank to use the page's existing description"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>

      {msg ? (
        <p
          className={`text-sm rounded-lg px-3 py-2 border ${
            status === "error"
              ? "text-[var(--color-accent)] bg-[var(--color-accent-soft)] border-[var(--color-accent)]"
              : "text-[var(--color-ink)] bg-[var(--color-paper)] border-[var(--color-line)]"
          }`}
        >
          {msg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "uploading"}
        className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "uploading" ? "Uploading…" : "Upload & save"}
      </button>
    </form>
  );
}
