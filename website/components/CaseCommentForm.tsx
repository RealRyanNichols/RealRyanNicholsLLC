"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CaseCommentableType } from "@/lib/case";
import { trackEvent } from "@/lib/analytics";

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
  const started = useRef(false);
  const pathname = usePathname();
  const signupHref = `/login?mode=signup&next=${encodeURIComponent(pathname || "/account")}`;

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-accent)]">
          Add to the record
        </p>
        <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--color-ink)]">
          Create an account to comment on this case.
        </h3>
        <p className="mt-2 leading-relaxed text-[var(--color-ink-soft)]">
          Bring the opinion, question, or missing context that other platforms
          bury. Comments are signed-only, moderated, and tied to one real profile.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link className="btn-accent rounded-lg px-4 py-2 text-xs font-bold" href={signupHref}>
            Join and comment
          </Link>
          <Link className="text-xs font-semibold text-[var(--color-muted)] underline underline-offset-4" href="/login">
            Already have an account?
          </Link>
          <Link className="text-xs font-semibold text-[var(--color-muted)] underline underline-offset-4" href="/community-rules">
            community rules
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    trackEvent("case_comment_submit_attempt", { type, slug });
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/case-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, slug, body }),
      });
      const json = await res.json();
      if (!res.ok) {
        trackEvent("case_comment_submit_failed", { type, slug });
        setState({ kind: "error", message: json.error ?? "Could not post comment." });
        return;
      }
      trackEvent("case_comment_submit_success", { type, slug });
      setState({ kind: "success" });
      setBody("");
    } catch {
      trackEvent("case_comment_submit_failed", { type, slug });
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
        onChange={(e) => {
          const next = e.target.value;
          setBody(next);
          if (next.trim().length > 0 && !started.current) {
            started.current = true;
            trackEvent("case_comment_start", { type, slug });
          }
        }}
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
