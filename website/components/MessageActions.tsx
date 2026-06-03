"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type MessageStatus = "new" | "reviewed" | "replied" | "archived";

const OPTIONS: { value: MessageStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

export function MessageActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function update(nextStatus: MessageStatus) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Update failed.");
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
      <div className="flex flex-wrap gap-2">
        {OPTIONS.filter((option) => option.value !== currentStatus).map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isPending}
            onClick={() => update(option.value)}
            className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs font-semibold hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
          >
            Mark {option.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-[var(--color-accent)]">{error}</p> : null}
    </div>
  );
}
