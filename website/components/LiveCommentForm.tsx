"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getSessionId, getVisitorId } from "@/lib/client-ids";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function LiveCommentForm({ liveStreamId }: { liveStreamId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) {
      trackEvent("live_comment_failed", { reason: "empty" });
      setState({ kind: "error", message: "Write a comment first." });
      return;
    }

    trackEvent("live_comment_attempt");
    setState({ kind: "submitting" });
    try {
      const response = await fetch("/api/live-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          live_stream_id: liveStreamId,
          display_name: displayName || undefined,
          body,
          session_id: getSessionId() || undefined,
          visitor_id: getVisitorId() || undefined,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        trackEvent("live_comment_failed", { reason: "api" });
        setState({
          kind: "error",
          message: json.error ?? "Could not post comment.",
        });
        return;
      }
      trackEvent("live_comment_success");
      setBody("");
      setState({ kind: "success", message: "Posted." });
      router.refresh();
    } catch {
      trackEvent("live_comment_failed", { reason: "network" });
      setState({ kind: "error", message: "Network error. Try again." });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
    >
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
        Public comment
      </p>
      <div className="mt-3 grid gap-2">
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value.slice(0, 80))}
          placeholder="Display name (optional)"
          aria-label="Display name"
          autoComplete="name"
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        <textarea
          required
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, 1000))}
          placeholder="Add to the public conversation."
          aria-label="Live comment"
          rows={4}
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-relaxed text-[var(--color-muted)]">
          Public by default. Keep private tips, names, and evidence out of chat.
        </p>
        <button
          type="submit"
          disabled={state.kind === "submitting"}
          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-black text-[var(--color-paper)] disabled:opacity-60"
        >
          {state.kind === "submitting" ? "Posting..." : "Post"}
        </button>
      </div>
      {state.kind === "success" ? (
        <p className="mt-3 text-sm text-emerald-700">{state.message}</p>
      ) : null}
      {state.kind === "error" ? (
        <p className="mt-3 text-sm text-red-700">{state.message}</p>
      ) : null}
    </form>
  );
}
