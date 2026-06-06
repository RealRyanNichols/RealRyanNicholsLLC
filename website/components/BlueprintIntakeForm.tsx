"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  INTAKE_SECTIONS,
  blueprintPackage,
  formatUsd,
  type IntakeField,
} from "@/lib/blueprint";

type Values = Record<string, string | boolean>;

const DIY = blueprintPackage("diy_blueprint");

export function BlueprintIntakeForm() {
  const [values, setValues] = useState<Values>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setVal = (id: string, v: string | boolean) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    trackEvent("blueprint_intake_submit", {});
    try {
      const res = await fetch("/api/checkout/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "diy_blueprint", intake: values }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        setError(json.error ?? "Could not start checkout. Try again.");
        setBusy(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <div className="space-y-8">
        {INTAKE_SECTIONS.map((section) => (
          <section key={section.id} className="rrn-card p-5 sm:p-6">
            <h2 className="font-display text-xl font-black tracking-tight text-[var(--color-ink)]">
              {section.title}
            </h2>
            {section.intro ? (
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {section.intro}
              </p>
            ) : null}

            <div
              className={
                section.grid
                  ? "mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
                  : "mt-4 grid gap-4"
              }
            >
              {section.fields.map((field) => (
                <Field
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  onChange={(v) => setVal(field.id, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-5 sm:p-6">
        <p className="text-sm font-bold leading-relaxed text-[var(--color-blue-strong)]">
          The more you share, the more I can build your prompt stack around your
          real needs. You get a series of prompts plus 7 days of support to help
          you build the first version. You can leave anything blank.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3.5 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60 sm:w-auto"
        >
          {busy
            ? "Starting checkout..."
            : `Continue to secure checkout, ${formatUsd(DIY?.priceUsd ?? 2500)}`}
        </button>
        {error ? (
          <p className="mt-2 text-sm font-bold text-[var(--color-accent)]">{error}</p>
        ) : null}
        <p className="mt-3 text-xs font-semibold text-[var(--color-blue-strong)]/80">
          Secure payment by Stripe. Your answers are saved privately so I can
          build your prompts.
        </p>
      </div>
    </form>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: IntakeField;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}) {
  if (field.type === "toggle") {
    const checked = value === true;
    return (
      <label
        className={[
          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm font-semibold transition",
          checked
            ? "border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-blue-strong)]"
            : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-soft)] hover:border-[var(--color-blue)]",
        ].join(" ")}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-blue)]"
        />
        <span>{field.label}</span>
      </label>
    );
  }

  const id = `intake-${field.id}`;
  const strValue = typeof value === "string" ? value : "";

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-bold text-[var(--color-ink)]"
      >
        {field.label}
      </label>
      {field.help ? (
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">{field.help}</p>
      ) : null}
      {field.type === "textarea" ? (
        <textarea
          id={id}
          rows={3}
          value={strValue}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)]"
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)]"
        >
          <option value="">Choose one</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.type}
          value={strValue}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)]"
        />
      )}
    </div>
  );
}
