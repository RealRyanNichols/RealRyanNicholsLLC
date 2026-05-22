"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function OgImageDeleteButton({ path }: { path: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete() {
    setErr(null);
    try {
      const res = await fetch("/api/admin/og-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Delete failed.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setErr("Network error.");
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="text-xs font-bold rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-2.5 py-1 hover:opacity-90 disabled:opacity-50"
        >
          Confirm delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs font-semibold rounded-md border border-[var(--color-line)] px-2.5 py-1 hover:border-[var(--color-accent)]"
        >
          Cancel
        </button>
        {err ? <span className="text-xs text-[var(--color-accent)]">{err}</span> : null}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-accent)] underline"
    >
      Delete
    </button>
  );
}
