"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SupportNoteModerator({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function update(next: "published" | "archived") {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/support-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) {
        setErr("Failed — try again");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setErr("Network error");
      setBusy(false);
    }
  }

  const isPublished = status === "published";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {isPublished ? (
        <>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success-soft)] border border-[var(--color-success)]/40 px-2.5 py-1 text-xs font-bold text-[var(--color-success)]">
            ● On the wall
          </span>
          <button
            type="button"
            onClick={() => update("archived")}
            disabled={busy}
            className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-bold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] disabled:opacity-50"
          >
            {busy ? "…" : "Hide from wall"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => update("published")}
          disabled={busy}
          className="rounded-full bg-[var(--color-gold)] px-3 py-1 text-xs font-bold text-[var(--color-navy)] transition hover:bg-[var(--color-support-strong)] disabled:opacity-50"
        >
          {busy ? "…" : "Publish to wall →"}
        </button>
      )}
      {err ? <span className="text-xs font-bold text-[var(--color-danger)]">{err}</span> : null}
    </div>
  );
}
