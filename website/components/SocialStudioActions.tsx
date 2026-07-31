"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Per-variant actions for /admin/social: copy the text, download it as a
// .txt, mark it posted or dismissed. Plus a per-article Regenerate button.

export function VariantActions({
  id,
  platform,
  postSlug,
  body,
  status,
}: {
  id: string;
  platform: string;
  postSlug: string;
  body: string;
  status: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  function copy() {
    navigator.clipboard
      ?.writeText(body)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  function download() {
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${postSlug}-${platform}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }

  async function setStatus(status: "posted" | "dismissed" | "draft") {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/social/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-md bg-[var(--color-navy)] px-3 py-1.5 text-xs font-black text-[#fdf8ea] transition hover:bg-[var(--color-blue-strong)]"
        aria-live="polite"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <button
        type="button"
        onClick={download}
        className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
      >
        Download .txt
      </button>
      {status !== "posted" ? (
        <button
          type="button"
          onClick={() => setStatus("posted")}
          disabled={busy}
          className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-success)] hover:text-[var(--color-success)] disabled:opacity-50"
        >
          Mark posted
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setStatus("draft")}
          disabled={busy}
          className="rounded-md border border-[var(--color-success)] bg-[var(--color-success-soft)] px-3 py-1.5 text-xs font-black text-[var(--color-success)] disabled:opacity-50"
        >
          Posted ✓ (undo)
        </button>
      )}
      {status !== "posted" ? (
        <button
          type="button"
          onClick={() => setStatus("dismissed")}
          disabled={busy}
          className="rounded-md px-2 py-1.5 text-xs font-bold text-[var(--color-muted)] transition hover:text-[var(--color-ink)] disabled:opacity-50"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

export function RegenerateButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "Generation failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={regenerate}
        disabled={busy}
        className="rounded-md border border-[var(--color-navy)]/40 px-3 py-1.5 text-xs font-bold text-[var(--color-navy)] transition hover:border-[var(--color-navy)] disabled:opacity-50"
      >
        {busy ? "Writing…" : "Generate drafts"}
      </button>
      {error ? (
        <span className="text-xs font-semibold text-[var(--color-accent)]">{error}</span>
      ) : null}
    </span>
  );
}
