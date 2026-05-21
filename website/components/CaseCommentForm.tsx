"use client";

import { useState } from "react";
import Link from "next/link";
import type { CaseCommentableType } from "@/lib/case";

type Props = {
  type: CaseCommentableType;
  slug: string;
  signedIn: boolean;
};

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function CaseCommentForm({ type, slug, signedIn }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [body, setBody] = useState("");

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm">
        <p className="text-[var(--color-ink-soft)]">
          Comments here are signed-only. No anonymous accounts.{" "}
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
      const res = await fetch("/api/case-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, slug, body }),
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
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <label htmlFor="case-comment" className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
        Add your comment
      </label>
      <textarea
        id="case-comment"
        required
        minLength={1}
        maxLength={4000}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Stay on the case. Disagree without threats. Sign with your name."
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-muted)]">
          Goes to moderation first. Approved comments show up here.
        </p>
        <button
          type="submit"
          disabled={state.kind === "submitting" || body.length === 0}
          className="btn-accent rounded-lg px-4 py-2 text-sm disabled:opacity-60"
        >
          {state.kind === "submitting" ? "Posting..." : "Post comment"}
        </button>
      </div>
      {state.kind === "success" && (
        <p className="mt-3 text-sm text-emerald-400">
          Comment submitted. It will appear once approved.
        </p>
      )}
      {state.kind === "error" && (
        <p className="mt-3 text-sm text-[var(--color-accent)]">{state.message}</p>
      )}
    </form>
  );
}
