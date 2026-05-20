"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

export function NotifySubscribersButton({ postId }: { postId: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onClick() {
    if (state.kind === "sending") return;
    if (!confirm("Send this post to all email subscribers?")) return;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/notify-subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: json.error ?? "Send failed." });
        return;
      }
      const note = typeof json.note === "string" ? ` (${json.note})` : "";
      setState({
        kind: "done",
        message: `Sent to ${json.sent ?? 0}${json.failed ? `, ${json.failed} failed` : ""}${note}.`,
      });
    } catch {
      setState({ kind: "error", message: "Network error." });
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-accent-soft)] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Author tools</p>
        <p className="text-sm text-[var(--color-ink)]">Blast this post to all email subscribers.</p>
      </div>
      <div className="flex flex-col sm:items-end gap-1">
        <button
          type="button"
          onClick={onClick}
          disabled={state.kind === "sending"}
          className="btn-accent inline-flex items-center rounded-lg px-3 py-2 text-sm disabled:opacity-60"
        >
          {state.kind === "sending" ? "Sending…" : "Send to subscribers"}
        </button>
        {state.kind === "done" && (
          <p className="text-xs text-emerald-700">{state.message}</p>
        )}
        {state.kind === "error" && (
          <p className="text-xs text-red-700">{state.message}</p>
        )}
      </div>
    </div>
  );
}
