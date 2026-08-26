"use client";

import { useEffect, useState } from "react";
import {
  DEADMAN_CONFIRMATION_LABELS,
  DEADMAN_CONFIRMATION_TYPES,
  type DeadmanConfirmationType,
} from "@/lib/deadman-constants";

const inputClass =
  "w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-3 text-sm text-[var(--color-ink)]";

type ApiResult = {
  ok?: boolean;
  message?: string;
  released?: number;
  blocked?: number;
  active?: boolean;
  incident_code?: string;
  public_url?: string | null;
  next_eligible_at?: string | null;
  error?: string;
};

export function DeadmanSwitchForm({ allowReverse = false }: { allowReverse?: boolean }) {
  const [action, setAction] = useState<"activate" | "reverse">("activate");
  const [activatorId, setActivatorId] = useState("");
  const [code, setCode] = useState("");
  const [confirmationType, setConfirmationType] =
    useState<DeadmanConfirmationType>("official_booking_record");
  const [summary, setSummary] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [agency, setAgency] = useState("");
  const [facility, setFacility] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  useEffect(() => {
    const contact = new URLSearchParams(window.location.search).get("contact");
    if (contact && /^[a-z0-9][a-z0-9_-]{1,39}$/i.test(contact)) {
      setActivatorId(contact);
    }
  }, []);

  const sourceRequired =
    confirmationType === "official_booking_record" ||
    confirmationType === "filed_court_order" ||
    confirmationType === "custodial_agency_confirmation";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const payload =
      action === "activate"
        ? {
            action,
            activator_id: activatorId,
            code,
            confirmation_type: confirmationType,
            confirmation_summary: summary,
            source_url: sourceUrl,
            agency,
            facility,
            public_release_authorized: true,
          }
        : {
            action,
            code,
            resolution_summary: summary,
          };
    try {
      const response = await fetch("/api/deadman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json().catch(() => ({}))) as ApiResult;
      if (!response.ok) {
        setResult({ error: json.error ?? "Request failed." });
        return;
      }
      setResult(json);
      setCode("");
    } catch {
      setResult({ error: "Network error. No activation was confirmed." });
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    code.length >= 16 &&
    summary.trim().length >= (action === "activate" ? 12 : 10) &&
    (action === "reverse" ||
      (activatorId.trim().length >= 2 &&
        (!sourceRequired || sourceUrl.trim().length > 0)));

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
    >
      {allowReverse ? (
        <label className="block">
          <span className="mb-1 block text-sm font-black text-[var(--color-ink)]">
            Action
          </span>
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value as "activate" | "reverse");
              setResult(null);
              setSummary("");
            }}
            className="w-full rounded-lg border border-[var(--color-line)] px-3 py-3 text-sm font-bold"
          >
            <option value="activate">Report verified custody and activate</option>
            <option value="reverse">Resolve incident and turn off</option>
          </select>
        </label>
      ) : null}

      {action === "activate" ? (
        <div className={allowReverse ? "mt-4 space-y-4" : "space-y-4"}>
          <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">
            Activate only after you personally confirm custody. Being late,
            unreachable, or mentioned on social media is not enough.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trusted contact ID">
              <input
                required
                value={activatorId}
                onChange={(event) => setActivatorId(event.target.value)}
                autoComplete="username"
                className={inputClass}
                placeholder="Included in your private email"
              />
            </Field>
            <Field label="Private activation code">
              <input
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                type="password"
                autoComplete="current-password"
                minLength={16}
                className={inputClass}
                placeholder="Included in your private email"
              />
            </Field>
          </div>

          <Field label="How custody was confirmed">
            <select
              value={confirmationType}
              onChange={(event) =>
                setConfirmationType(event.target.value as DeadmanConfirmationType)
              }
              className={inputClass}
            >
              {DEADMAN_CONFIRMATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DEADMAN_CONFIRMATION_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="What did you confirm?"
            hint="One factual sentence is enough. It appears in the first public update."
          >
            <textarea
              required
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              minLength={12}
              maxLength={1200}
              rows={3}
              className={inputClass}
              placeholder="Example: Counsel confirmed Ryan was taken into custody after the meeting."
            />
          </Field>

          {sourceRequired ? (
            <Field
              label="Official source link"
              hint="Paste the booking, docket, order, or agency link."
            >
              <input
                required
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                type="url"
                className={inputClass}
                placeholder="https://..."
              />
            </Field>
          ) : null}

          <details className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3">
            <summary className="cursor-pointer text-sm font-bold">
              Add agency, facility, or source link (optional)
            </summary>
            <div className="mt-3 grid gap-4">
              {!sourceRequired ? (
                <Field label="Supporting source link">
                  <input
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    type="url"
                    className={inputClass}
                    placeholder="https://..."
                  />
                </Field>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Agency">
                  <input
                    value={agency}
                    onChange={(event) => setAgency(event.target.value)}
                    maxLength={160}
                    className={inputClass}
                  />
                </Field>
                <Field label="Facility">
                  <input
                    value={facility}
                    onChange={(event) => setFacility(event.target.value)}
                    maxLength={160}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </details>

          <p className="rounded-lg border border-red-700/30 bg-red-700/5 p-3 text-xs leading-relaxed">
            Pressing activate confirms that you personally verified custody and
            authorizes the public status bulletin and approved article queue.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <Field label="Private owner reversal code">
            <input
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              type="password"
              autoComplete="current-password"
              minLength={16}
              className={inputClass}
            />
          </Field>
          <Field label="Resolution summary">
            <textarea
              required
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              minLength={10}
              maxLength={1200}
              rows={4}
              className={inputClass}
              placeholder="Ryan checked in safe, was released, or the report was false."
            />
          </Field>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !canSubmit}
        className={[
          "mt-5 w-full rounded-lg px-5 py-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
          action === "activate"
            ? "bg-[var(--color-accent)] text-[var(--color-paper)] hover:bg-[var(--color-accent-strong)]"
            : "bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue-strong)]",
        ].join(" ")}
      >
        {busy
          ? "Verifying request..."
          : action === "activate"
            ? "Confirm custody and activate"
            : "Resolve incident and turn off"}
      </button>

      {result ? (
        <div
          className={[
            "mt-4 rounded-lg border p-4 text-sm leading-relaxed",
            result.error
              ? "border-red-700/30 bg-red-700/10 text-red-900"
              : "border-green-700/30 bg-green-700/10 text-[var(--color-ink)]",
          ].join(" ")}
        >
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <div>
              <p className="font-bold">{result.message ?? "Request recorded."}</p>
              {result.incident_code ? <p>Incident: {result.incident_code}</p> : null}
              {result.public_url ? (
                <p>
                  <a className="underline" href={result.public_url}>
                    Open the public bulletin
                  </a>
                </p>
              ) : null}
              {typeof result.released === "number" ? (
                <p>Released now: {result.released}</p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-[var(--color-ink)]">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs leading-relaxed text-[var(--color-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
