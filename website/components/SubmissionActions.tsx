"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SubmissionActions({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function call(action: "approve" | "reject" | "reset_pending", notes?: string) {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Action failed.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setErr("Network error.");
    }
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        <button
          type="button"
          disabled={isPending}
          onClick={() => call("reset_pending")}
          className="text-xs font-semibold rounded-md border border-[var(--color-line)] px-2.5 py-1 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
        >
          ↺ Reset to pending
        </button>
        {err ? <span className="text-xs text-[var(--color-accent)]">{err}</span> : null}
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-[var(--color-line)] pt-3">
      {!showReject ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => call("approve")}
            className="rounded-md bg-[var(--color-success)] hover:opacity-90 px-3 py-1.5 text-xs font-bold text-[var(--color-paper)] disabled:opacity-50"
            title="Publish on the J6 profile"
          >
            ✓ Approve & publish
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowReject(true)}
            className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            ✗ Reject…
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            rows={2}
            placeholder="Why rejected? (saved to submission_notes; not auto-emailed)"
            className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => call("reject", rejectNotes)}
              className="rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] px-3 py-1.5 text-xs font-bold text-[var(--color-paper)] disabled:opacity-50"
            >
              Confirm reject
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReject(false);
                setRejectNotes("");
              }}
              className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {err ? <p className="mt-2 text-xs text-[var(--color-accent)]">{err}</p> : null}
    </div>
  );
}
