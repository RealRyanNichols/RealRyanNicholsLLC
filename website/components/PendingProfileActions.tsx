"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Review link + a real Delete for a pending-verification row. Delete uses a
// two-tap confirm (tap once → "Really delete?") so a stray thumb can't nuke
// a real person's signup.
export function PendingProfileActions({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Delete failed.");
        setConfirming(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
      {error ? (
        <span className="text-[10px] font-bold text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
      {confirming ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={doDelete}
            className="text-xs font-bold text-[var(--color-danger)] hover:underline disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Really delete?"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming(false)}
            className="text-xs font-semibold text-[var(--color-muted)] hover:underline"
          >
            Keep
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-xs font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-danger)]"
        >
          Delete
        </button>
      )}
      <Link
        href="/admin/users?filter=pending"
        className="text-xs font-semibold text-[var(--color-navy)] hover:underline"
      >
        Review →
      </Link>
    </div>
  );
}
