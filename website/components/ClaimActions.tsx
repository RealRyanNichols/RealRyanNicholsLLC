"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ClaimActions({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  async function act(action: "approve" | "reject") {
    setError(null);
    try {
      const res = await fetch(`/api/admin/claims/${claimId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: action === "reject" ? rejectNotes : undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Action failed.");
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
      {!showReject ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => act("approve")}
            className="text-sm font-bold rounded-md border-2 border-[var(--color-success)] bg-[var(--color-success)] text-white px-4 py-1.5 hover:opacity-90 disabled:opacity-50"
          >
            Approve this claim
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowReject(true)}
            className="text-sm font-semibold rounded-md border border-[var(--color-line)] px-3 py-1.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
          >
            Reject…
          </button>
          <span className="ml-auto text-xs text-[var(--color-muted)] italic">
            Approving auto-rejects every other pending claim on this profile.
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            rows={2}
            placeholder="Why rejected? (visible to the claimant — keep it factual)"
            className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => act("reject")}
              className="text-sm font-bold rounded-md border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-white px-4 py-1.5 hover:opacity-90 disabled:opacity-50"
            >
              Confirm reject
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReject(false);
                setRejectNotes("");
              }}
              className="text-sm font-semibold rounded-md border border-[var(--color-line)] px-3 py-1.5 hover:border-[var(--color-accent)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
