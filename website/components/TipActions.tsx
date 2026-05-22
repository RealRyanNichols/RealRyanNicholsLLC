"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "pending" | "reviewed" | "merged" | "rejected";

const OPTIONS: { value: Status; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "merged", label: "Merged" },
  { value: "rejected", label: "Rejected" },
];

export function TipActions({
  id,
  currentStatus,
  currentNotes,
}: {
  id: string;
  currentStatus: string;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  async function update(nextStatus: Status, nextNotes?: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/tips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          reviewed_notes: nextNotes ?? notes,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Update failed.");
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Network error.");
    }
  }

  return (
    <div className="mt-4 border-t border-[var(--color-line)] pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {OPTIONS.filter((o) => o.value !== currentStatus).map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={isPending}
            onClick={() => update(o.value)}
            className="text-xs font-semibold rounded-md border border-[var(--color-line)] px-2.5 py-1 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
          >
            Mark {o.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          className="text-xs font-semibold rounded-md border border-[var(--color-line)] px-2.5 py-1 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] ml-auto"
        >
          {showNotes ? "Hide notes" : "Edit notes"}
        </button>
      </div>

      {showNotes ? (
        <div className="mt-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes (visible to admins only)"
            className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => update(currentStatus as Status, notes)}
            className="mt-2 text-xs font-semibold rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] text-white px-3 py-1 hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
          >
            Save notes
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-[var(--color-accent)]">{error}</p> : null}
    </div>
  );
}
