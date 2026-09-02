"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ApiResult = {
  ok?: boolean;
  active?: boolean;
  incident_code?: string;
  public_url?: string | null;
  message?: string;
  error?: string;
};

type TriggerSource = {
  url: string;
  publisher?: string;
  headline?: string;
  published_at?: string;
};

function monitoredSourcesFromLocation(): TriggerSource[] {
  const params = new URLSearchParams(window.location.search);
  const urls = params.getAll("source").slice(0, 5);
  const publishers = params.getAll("publisher");
  const headlines = params.getAll("headline");
  const publishedAt = params.getAll("published_at");

  return urls.flatMap((value, index) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      return [{
        url: url.toString().slice(0, 1000),
        publisher: publishers[index]?.trim().slice(0, 160) || undefined,
        headline: headlines[index]?.trim().slice(0, 300) || undefined,
        published_at: publishedAt[index]?.trim().slice(0, 80) || undefined,
      }];
    } catch {
      return [];
    }
  });
}

export function AdminDeadmanToggle({ active }: { active: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [triggerSources, setTriggerSources] = useState<TriggerSource[]>([]);

  useEffect(() => {
    setTriggerSources(monitoredSourcesFromLocation());
  }, []);

  const action = active ? "admin_reverse" : "admin_activate";
  const actionLabel = active ? "Turn off" : "Turn on";

  async function confirmToggle() {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/deadman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          confirmed: true,
          ...(action === "admin_activate" && triggerSources.length
            ? { trigger_sources: triggerSources }
            : {}),
        }),
      });
      const json = (await response.json().catch(() => ({}))) as ApiResult;
      if (!response.ok) {
        setResult({ error: json.error ?? "The switch did not change." });
        return;
      }
      setResult(json);
      setPending(false);
      router.refresh();
    } catch {
      setResult({ error: "Network error. The switch change was not confirmed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <p className="text-xs font-black uppercase tracking-normal text-[var(--color-muted)]">
        Signed-in admin control
      </p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[var(--color-ink)]">Current state</p>
          <p className={active ? "text-2xl font-black text-red-800" : "text-2xl font-black text-green-800"}>
            {active ? "ON" : "OFF"}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={[
            "h-5 w-5 rounded-full border-4",
            active ? "border-red-800 bg-red-500" : "border-green-800 bg-green-500",
          ].join(" ")}
        />
      </div>

      {!pending ? (
        <button
          type="button"
          onClick={() => {
            setPending(true);
            setResult(null);
          }}
          className={[
            "mt-5 w-full rounded-lg px-5 py-4 text-base font-black transition",
            active
              ? "bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue-strong)]"
              : "bg-[var(--color-accent)] text-[var(--color-paper)] hover:bg-[var(--color-accent-strong)]",
          ].join(" ")}
        >
          Click to {actionLabel.toLowerCase()}
        </button>
      ) : (
        <div className="mt-5 rounded-lg border-2 border-amber-500 bg-amber-50 p-4 text-amber-950">
          <p className="font-black">Second confirmation</p>
          <p className="mt-2 text-sm leading-relaxed">
            {active
              ? "Turning this off stops future releases and leaves the published record intact."
              : "Turning this on immediately publishes the first custody bulletin and starts hourly releases."}
          </p>
          {!active && triggerSources.length ? (
            <p className="mt-2 text-xs font-bold">
              {triggerSources.length} monitored news source{triggerSources.length === 1 ? "" : "s"} will be attached to the incident record.
            </p>
          ) : null}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setPending(false)}
              className="rounded-lg border border-amber-900/30 bg-white px-4 py-3 text-sm font-black disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={confirmToggle}
              className={[
                "rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-50",
                active ? "bg-[var(--color-blue)]" : "bg-red-800",
              ].join(" ")}
            >
              {busy ? "Changing switch..." : `Yes, ${actionLabel.toLowerCase()} now`}
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
        No contact ID, activation code, or source form is required here. Access is controlled by the signed-in administrator session. Every change is still written to the private audit log.
      </p>

      {result ? (
        <div
          aria-live="polite"
          className={[
            "mt-4 rounded-lg border p-4 text-sm leading-relaxed",
            result.error
              ? "border-red-700/30 bg-red-700/10 text-red-900"
              : "border-green-700/30 bg-green-700/10 text-[var(--color-ink)]",
          ].join(" ")}
        >
          <p className="font-bold">{result.error ?? result.message ?? "Switch updated."}</p>
          {result.incident_code ? <p>Incident: {result.incident_code}</p> : null}
          {result.public_url ? (
            <p>
              <a className="underline" href={result.public_url}>
                Open the public bulletin
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
