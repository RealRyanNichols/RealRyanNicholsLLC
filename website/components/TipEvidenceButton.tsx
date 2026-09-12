"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// One-click "Save to evidence" on a tip. Creates a PRIVATE, pending case
// document and refreshes the board. Honest feedback on success/failure.
export function TipEvidenceButton({ tipId }: { tipId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (state === "saving") return;
    setState("saving");
    setError(null);
    try {
      const res = await fetch(`/api/admin/tips/${tipId}/to-evidence`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setState("error");
        setError(json.error ?? "Could not save.");
        return;
      }
      setState("done");
      startTransition(() => router.refresh());
    } catch {
      setState("error");
      setError("Network error.");
    }
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-2 border border-[var(--color-success)]/50 bg-[var(--color-success-soft)] px-3 py-2 text-xs font-black uppercase tracking-normal text-[var(--color-success)]">
        ✓ Saved to evidence (private)
        <a href="/admin/case" className="underline">
          open
        </a>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={state === "saving"}
      className="border border-[var(--color-success)]/60 bg-[var(--color-success-soft)] px-3 py-2 text-xs font-black uppercase tracking-normal text-[var(--color-success)] transition hover:bg-[var(--color-success)]/20 disabled:opacity-60"
      title="Files this tip's link as a private exhibit to verify"
    >
      {state === "saving" ? "Saving…" : "📎 Save to evidence"}
      {error ? <span className="ml-1 normal-case text-[var(--color-danger)]">· {error}</span> : null}
    </button>
  );
}
