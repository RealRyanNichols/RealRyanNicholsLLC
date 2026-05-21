"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "submitting" | "ok" | "error";

export function ClaimForm({
  slug,
  userEmail,
}: {
  slug: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      claimant_email: String(fd.get("claimant_email") ?? "").trim() || userEmail,
      doj_case_number: String(fd.get("doj_case_number") ?? "").trim() || null,
      proof: String(fd.get("proof") ?? "").trim(),
    };

    try {
      const res = await fetch(`/api/case/people/${slug}/claim`, {
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
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-6">
        <h2 className="text-2xl font-bold tracking-tight font-display">
          Claim submitted.
        </h2>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Ryan will review your claim personally. You&apos;ll get an email at{" "}
          <span className="font-mono">{userEmail}</span> when there&apos;s a
          decision.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Best email to reach you"
        name="claimant_email"
        type="email"
        defaultValue={userEmail}
        required
        hint="We send the verification result here. Not made public."
      />

      <Field
        label="DOJ case number (optional but helpful)"
        name="doj_case_number"
        placeholder="e.g. 1:21-cr-00117"
        hint="Format: district:year-type-number. Speeds verification a lot."
      />

      <Field
        label="Why this is you"
        name="proof"
        required
        textarea
        rows={8}
        placeholder="Anything Ryan can use to verify you against the public record. Examples: a link to your court docket, a mugshot URL, the pardon proclamation entry, a news article naming you, a video of you on Jan 6, your sentencing date, the lead prosecutor's name. The more specific, the faster verification."
        hint="Verification is by hand. Help Ryan help you."
      />

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
        {status === "submitting" ? "Submitting…" : "Submit claim →"}
      </button>

      <p className="text-xs text-[var(--color-muted)] text-center">
        One claim per profile per account. Imposters get rejected. Ryan
        verifies personally.
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
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
}) {
  const id = `claim-${name}`;
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
          defaultValue={defaultValue}
          className={`${baseCls} font-sans resize-y`}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type ?? "text"}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={baseCls}
        />
      )}
      {hint ? <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p> : null}
    </div>
  );
}
