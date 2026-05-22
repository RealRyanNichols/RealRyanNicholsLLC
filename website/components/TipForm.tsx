"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "ok" | "error";

export function TipForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const urls = String(fd.get("urls") ?? "")
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//i.test(s));

    const payload = {
      submitter_name: String(fd.get("submitter_name") ?? "").trim() || null,
      submitter_email: String(fd.get("submitter_email") ?? "").trim() || "",
      defendant_name: String(fd.get("defendant_name") ?? "").trim(),
      narrative: String(fd.get("narrative") ?? "").trim(),
      urls,
    };

    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "Something went wrong. Try again.");
        return;
      }
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-6">
        <h2 className="text-2xl font-bold tracking-tight font-display">
          Tip received.
        </h2>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          We read every tip. If we need more, we'll reach out at the email you
          provided.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-semibold text-[var(--color-accent)] hover:underline"
        >
          Send another →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Whose case is this?"
        name="defendant_name"
        required
        placeholder="e.g. Jason Wallis (or 'myself')"
        hint="The name of the January 6 defendant this tip is about. If it's you, put your own name."
      />

      <Field
        label="The story / evidence"
        name="narrative"
        required
        textarea
        rows={8}
        placeholder="What happened. What's the evidence. Dates if you have them. Where the records live if you know."
      />

      <Field
        label="Links (optional)"
        name="urls"
        textarea
        rows={3}
        placeholder="https://example.com/court-doc.pdf&#10;https://twitter.com/post"
        hint="One per line. Court documents, news stories, social posts, video URLs."
      />

      <div className="border-t border-[var(--color-line)] pt-4 space-y-4">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          So we can follow up (optional)
        </p>
        <Field
          label="Your name"
          name="submitter_name"
          placeholder="Optional"
        />
        <Field
          label="Your email"
          name="submitter_email"
          type="email"
          placeholder="Optional"
          hint="Only used to follow up. Not added to any list. Not made public."
        />
      </div>

      {errorMsg ? (
        <p className="text-sm text-[var(--color-accent)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)] rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-white px-5 py-4 font-bold text-lg hover:bg-[var(--color-accent-strong)] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Sending…" : "Send tip →"}
      </button>

      <p className="text-xs text-[var(--color-muted)] text-center">
        Tips are reviewed by hand. We do not store your IP — only a one-way
        hash for rate limiting.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  textarea,
  rows,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  const id = `tip-${name}`;
  const baseCls =
    "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]";
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1.5">
        {label}
        {required ? <span className="text-[var(--color-accent)] ml-1">*</span> : null}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          required={required}
          rows={rows ?? 4}
          placeholder={placeholder}
          className={`${baseCls} font-sans resize-y`}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type ?? "text"}
          required={required}
          placeholder={placeholder}
          className={baseCls}
        />
      )}
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
