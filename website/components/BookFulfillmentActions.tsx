"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BookFulfillmentActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function prepareQueue() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/book-fulfillment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prepare" }),
      });
      const result = (await response.json()) as { error?: string; prepared?: number };
      if (!response.ok) throw new Error(result.error || "The queue could not be prepared.");
      setMessage(`${result.prepared ?? 0} paid physical orders were reconciled with the held queue.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The queue could not be prepared.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={prepareQueue}
        disabled={busy}
        className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Preparing…" : "Prepare held queue"}
      </button>
      <p className="text-xs text-[var(--color-muted)]">
        This does not place an order or create a charge.
      </p>
      {message ? <p className="w-full text-sm text-[var(--color-ink-soft)]">{message}</p> : null}
    </div>
  );
}
