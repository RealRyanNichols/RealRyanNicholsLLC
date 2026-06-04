"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Signal = "verify" | "connection" | "dispute" | "context";

const COPY: Record<Signal, { label: string; title: string; placeholder: string }> = {
  verify: {
    label: "Verify",
    title: "I can help verify this",
    placeholder: "What can you confirm? Add a date, record link, witness detail, or how you know.",
  },
  connection: {
    label: "Connect",
    title: "This connects to another record",
    placeholder: "What does this connect to? Add a person, case number, agency, document, video, date, location, or public link.",
  },
  dispute: {
    label: "Dispute",
    title: "This may be wrong",
    placeholder: "What part is wrong or needs correction? Keep it factual.",
  },
  context: {
    label: "Add context",
    title: "I have related context",
    placeholder: "What connects to this? Names, agencies, documents, dates, locations, or another case.",
  },
};

export function IntakeSignalForm({
  itemId,
  publicRef,
}: {
  itemId: string;
  publicRef: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Signal | null>(null);
  const [note, setNote] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submit(action: Signal) {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/intake-verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake_item_id: itemId,
          action,
          note: note.trim() || null,
          display_name: displayName.trim() || null,
          email: email.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not save that signal.");
        return;
      }
      setMessage(`${COPY[action].label} signal saved for ${publicRef}.`);
      setNote("");
      setDisplayName("");
      setEmail("");
      setSelected(null);
      startTransition(() => router.refresh());
    } catch {
      setError("Network error. Try again.");
    }
  }

  return (
    <div className="mt-4 border-t border-[var(--color-line)] pt-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(COPY) as Signal[]).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => {
              setSelected((current) => (current === action ? null : action));
              setMessage(null);
              setError(null);
            }}
            className={[
              "rrn-tap min-h-11 rounded-lg border px-2 text-sm font-bold transition",
              selected === action
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            {COPY[action].label}
          </button>
        ))}
      </div>

      {selected ? (
        <div className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
          <p className="text-sm font-bold text-[var(--color-ink)]">
            {COPY[selected].title}
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={COPY[selected].placeholder}
            className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
          />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={120}
              placeholder="Name or handle (optional)"
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              maxLength={254}
              placeholder="Email for follow-up (optional)"
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => submit(selected)}
            className="rrn-tap mt-3 w-full rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-accent)] disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Send signal"}
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="mt-2 text-xs font-bold text-[var(--color-success)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs font-bold text-[var(--color-accent)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
