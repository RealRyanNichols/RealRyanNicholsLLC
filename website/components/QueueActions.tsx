"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Approve / reject / publish actions for a content-queue row. Publishing is
// the human manual-review step — it creates the public post and pings the
// search engines.
export function QueueActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "publish") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        post_slug?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Action failed.");
        return;
      }
      if (action === "publish" && json.post_slug) {
        setPublishedSlug(json.post_slug);
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(null);
    }
  }

  if (publishedSlug) {
    return (
      <a
        href={`/posts/${publishedSlug}`}
        className="text-sm font-bold text-[var(--color-success)] hover:underline"
      >
        Live — read it →
      </a>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" ? (
        <>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => act("approve")}
            className="min-h-10 rounded-lg border border-[var(--color-navy)] px-3.5 py-1.5 text-sm font-bold text-[var(--color-navy)] transition hover:bg-[var(--color-navy)] hover:text-[#fdf8ea] disabled:opacity-50"
          >
            {busy === "approve" ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => act("reject")}
            className="min-h-10 rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--color-muted)] transition hover:text-[var(--color-danger)] disabled:opacity-50"
          >
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
        </>
      ) : null}
      {status === "approved" ? (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => act("publish")}
          className="btn-accent inline-flex min-h-10 items-center px-5 py-2 text-sm disabled:opacity-50"
        >
          {busy === "publish" ? "Publishing…" : "Publish now →"}
        </button>
      ) : null}
      {error ? (
        <p className="w-full text-xs font-bold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
