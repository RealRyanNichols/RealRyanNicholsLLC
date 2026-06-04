"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "pending" | "reviewed" | "merged" | "rejected";
type OutcomeStatus =
  | "unworked"
  | "article_draft"
  | "article_published"
  | "solution_brief"
  | "case_mapped"
  | "evidence_verified"
  | "private_reply"
  | "service_lead"
  | "invoice_sent"
  | "watch_file"
  | "closed";

const OPTIONS: { value: Status; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "merged", label: "Merged" },
  { value: "rejected", label: "Rejected" },
];

const OUTCOME_OPTIONS: { value: OutcomeStatus; label: string; hint: string }[] = [
  { value: "article_draft", label: "Article draft", hint: "Post started" },
  { value: "solution_brief", label: "Solution brief", hint: "Answer created" },
  { value: "case_mapped", label: "Case mapped", hint: "Nexus/ledger" },
  { value: "evidence_verified", label: "Verified", hint: "Source checked" },
  { value: "private_reply", label: "Replied", hint: "Answered privately" },
  { value: "service_lead", label: "Service lead", hint: "Offer/invoice path" },
  { value: "invoice_sent", label: "Invoice sent", hint: "Money lane" },
  { value: "watch_file", label: "Watch file", hint: "Needs more" },
  { value: "closed", label: "Closed", hint: "Done for now" },
];

export function TipActions({
  id,
  currentStatus,
  currentNotes,
  currentOutcomeStatus,
  currentOutcomeUrl,
  currentOutcomeNotes,
}: {
  id: string;
  currentStatus: string;
  currentNotes: string | null;
  currentOutcomeStatus?: string | null;
  currentOutcomeUrl?: string | null;
  currentOutcomeNotes?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [outcomeUrl, setOutcomeUrl] = useState(currentOutcomeUrl ?? "");
  const [outcomeNotes, setOutcomeNotes] = useState(currentOutcomeNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  async function update(
    nextStatus: Status,
    nextNotes?: string,
    outcome?: {
      outcome_status?: OutcomeStatus;
      outcome_url?: string | null;
      outcome_notes?: string | null;
    },
  ) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/tips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          reviewed_notes: nextNotes ?? notes,
          ...outcome,
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

      <section className="mt-3 border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Outcome
            </p>
            <p className="mt-1 text-sm font-bold">
              {outcomeLabel(currentOutcomeStatus)}
            </p>
          </div>
          {currentOutcomeUrl ? (
            <a
              href={currentOutcomeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[var(--color-line)] px-2.5 py-1 text-xs font-black uppercase tracking-normal hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Open result
            </a>
          ) : null}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {OUTCOME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={isPending || option.value === currentOutcomeStatus}
              onClick={() =>
                update(currentStatus as Status, notes, {
                  outcome_status: option.value,
                  outcome_url: outcomeUrl.trim() || null,
                  outcome_notes: outcomeNotes.trim() || null,
                })
              }
              className={[
                "border px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                option.value === currentOutcomeStatus
                  ? "border-[#7fe3a9] bg-[#7fe3a9]/20"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]",
              ].join(" ")}
            >
              <span className="block text-xs font-black leading-4">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold leading-4 text-[var(--color-muted)]">
                {option.hint}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Result link
            </span>
            <input
              value={outcomeUrl}
              onChange={(e) => setOutcomeUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Outcome note
            </span>
            <input
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder="What got done?"
              className="mt-1 w-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
          </label>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              update(currentStatus as Status, notes, {
                outcome_status: isOutcomeStatus(currentOutcomeStatus)
                  ? currentOutcomeStatus
                  : "unworked",
                outcome_url: outcomeUrl.trim() || null,
                outcome_notes: outcomeNotes.trim() || null,
              })
            }
            className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-2 text-xs font-black uppercase tracking-normal text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
          >
            Save outcome
          </button>
        </div>
      </section>

      {error ? <p className="mt-2 text-xs text-[var(--color-accent)]">{error}</p> : null}
    </div>
  );
}

function outcomeLabel(value?: string | null) {
  if (!value || value === "unworked") return "No outcome yet";
  return (
    OUTCOME_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

function isOutcomeStatus(value?: string | null): value is OutcomeStatus {
  return (
    value === "unworked" ||
    OUTCOME_OPTIONS.some((option) => option.value === value)
  );
}
