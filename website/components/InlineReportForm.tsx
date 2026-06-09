"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

// Inline "report what you saw" form, embedded in an article via the {{report}}
// shortcode. Posts to the existing /api/tips intake (category "j6"), so reports
// land in the same reviewed inbox as the tip line. Anonymous by default.
export function InlineReportForm({
  subject,
  kicker = "Were you there?",
  heading = "Report what you saw at the D.C. Jail.",
  blurb = "If you witnessed these officers — or were held there yourself — say what you saw. Anonymous is fine; leave contact only if we can follow up. Every report is reviewed by hand and becomes part of the record.",
  placeholder = "What you saw or experienced — names, dates, the unit or SHU, anything you remember.",
  buttonLabel = "Send my report →",
}: {
  subject?: string;
  kicker?: string;
  heading?: string;
  blurb?: string;
  placeholder?: string;
  buttonLabel?: string;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const narrative = String(fd.get("narrative") ?? "").trim();
    if (narrative.length < 20) {
      setErr("Tell us a bit more — at least a couple of sentences.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErr(null);
    const payload = {
      category: "j6" as const,
      defendant_name: subject || "D.C. Jail — Lt. Allen / Lt. Lancaster / Cpl. Hayes",
      narrative,
      submitter_name: String(fd.get("submitter_name") ?? "").trim() || null,
      submitter_email: String(fd.get("submitter_email") ?? "").trim() || "",
    };
    trackEvent("report_submit_attempt", { source: "inline-article" });
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(json.error ?? "Something went wrong. Try again.");
        setStatus("error");
        return;
      }
      trackEvent("report_submit_success", { source: "inline-article" });
      setStatus("ok");
      form.reset();
    } catch {
      setErr("Network error. Try again.");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="not-prose rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-6">
        <h3 className="text-xl font-bold tracking-tight font-display">Report received.</h3>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Thank you. It&apos;s reviewed by hand and added to the record. If you left
          contact info, we may reach out to verify.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]";

  return (
    <div className="not-prose rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-6">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        {kicker}
      </p>
      <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
        {heading}
      </h3>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
        {blurb}
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <textarea
          name="narrative"
          required
          rows={6}
          placeholder={placeholder}
          className={`${inputCls} font-sans resize-y`}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="submitter_name" placeholder="Your name (optional)" className={inputCls} />
          <input
            name="submitter_email"
            type="email"
            placeholder="Email (optional — for follow-up)"
            className={inputCls}
          />
        </div>
        {err ? (
          <p className="text-sm font-semibold text-[var(--color-accent)]">{err}</p>
        ) : null}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-white px-5 py-3.5 font-bold hover:bg-[var(--color-accent-strong)] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending…" : buttonLabel}
        </button>
        <p className="text-xs text-[var(--color-muted)] text-center">
          Reviewed by hand. We don&apos;t store your IP — only a one-way hash for rate
          limiting.
        </p>
      </form>
    </div>
  );
}
