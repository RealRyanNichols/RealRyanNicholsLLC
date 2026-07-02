"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

// Case-build request form. Rides the existing tips pipeline (category
// "other" + a [Case Builder] subject prefix) so every request lands in
// /admin/tips AND fires the admin email alert — Ryan receives it personally,
// no new backend.
export function CaseBuildRequestForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [caseName, setCaseName] = useState("");
  const [story, setStory] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "submitting") return;
    setState({ kind: "submitting" });
    trackEvent("case_build_request", { step: "submit" });
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "other",
          submitter_name: name.trim() || null,
          submitter_email: email.trim(),
          defendant_name: `[Case Builder] ${caseName.trim() || "unnamed case"}`,
          narrative: story.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setState({
          kind: "error",
          message: json.error ?? "Could not send. Try again.",
        });
        return;
      }
      trackEvent("case_build_request", { step: "success" });
      setState({ kind: "success" });
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  }

  if (state.kind === "success") {
    return (
      <div className="rounded-2xl border-2 border-[var(--color-success)] bg-[var(--color-success-soft)] p-6">
        <p className="text-lg font-bold text-[var(--color-ink)]">
          Got it. Ryan reads every request himself.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          You&apos;ll hear back at the email you left. In the meantime, walk the
          live example — it&apos;s exactly what your case archive would look
          like.
        </p>
        <a
          href="/case"
          className="mt-4 inline-flex items-center rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-bold text-[#fdf8ea] transition hover:bg-[var(--color-blue)]"
        >
          See the live example →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Your name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm"
            placeholder="First and last"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm"
            placeholder="you@email.com"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          The case
        </span>
        <input
          value={caseName}
          onChange={(e) => setCaseName(e.target.value)}
          required
          maxLength={180}
          className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm"
          placeholder="Smith v. Anytown ISD — or just describe it in a few words"
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Tell the story — what happened, what records you have
        </span>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          required
          minLength={20}
          maxLength={20000}
          rows={6}
          className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm leading-relaxed"
          placeholder="A few honest paragraphs. What happened, who was involved, what paper exists (filings, photos, recordings, messages), and what you want the public to be able to check."
        />
      </label>
      {state.kind === "error" ? (
        <p className="text-sm font-semibold text-[var(--color-danger)]">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={state.kind === "submitting"}
        className="btn-accent inline-flex items-center px-6 py-3 text-sm disabled:opacity-60"
      >
        {state.kind === "submitting" ? "Sending…" : "Request my case build →"}
      </button>
      <p className="text-xs leading-relaxed text-[var(--color-muted)]">
        Goes straight to Ryan — same intake ledger as everything else on this
        site. Don&apos;t send anything sealed or under protective order.
      </p>
    </form>
  );
}
