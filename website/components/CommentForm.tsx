"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  postId: string;
  signedIn: boolean;
};

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function CommentForm({ postId, signedIn }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [body, setBody] = useState("");

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 text-sm">
        <p className="text-[var(--color-ink-soft)]">
          Comments are signed-only. No anonymous accounts.{" "}
          <Link className="text-[var(--color-accent)] underline" href="/login">
            Sign in to comment
          </Link>
          . Read the{" "}
          <Link className="underline" href="/community-rules">
            community rules
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, body }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: json.error ?? "Could not post comment." });
        return;
      }
      setState({ kind: "success" });
      setBody("");
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <label htmlFor="comment" className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
        Add your comment
      </label>
      <textarea
        id="comment"
        required
        minLength={1}
        maxLength={4000}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Disagree without threats. Sign with your name."
        className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-muted)]">
          Goes to moderation first. Approved comments show up here.
        </p>
        <button
          type="submit"
          disabled={state.kind === "submitting" || body.length === 0}
          className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-white text-sm font-medium hover:bg-[var(--color-accent)] disabled:opacity-60 transition"
        >
          {state.kind === "submitting" ? "Posting..." : "Post comment"}
        </button>
      </div>
      {state.kind === "success" && (
        <p className="mt-3 text-sm text-emerald-700">
          Comment submitted. It will appear once approved.
        </p>
      )}
      {state.kind === "error" && (
        <p className="mt-3 text-sm text-red-700">{state.message}</p>
      )}
    </form>
  );
}
