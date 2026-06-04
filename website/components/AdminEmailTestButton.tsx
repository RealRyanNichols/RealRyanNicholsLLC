"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function AdminEmailTestButton() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function sendTest() {
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/admin/email-test", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        recipients?: number;
      };
      if (!res.ok) {
        setState({
          kind: "error",
          message: json.error ?? "Email test failed.",
        });
        return;
      }
      setState({
        kind: "success",
        message: `Sent to ${json.recipients ?? 1} admin recipient${json.recipients === 1 ? "" : "s"}.`,
      });
    } catch {
      setState({ kind: "error", message: "Network error while testing email." });
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={sendTest}
        disabled={state.kind === "sending"}
        className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-60"
      >
        {state.kind === "sending" ? "Testing..." : "Send test email"}
      </button>
      {state.kind === "success" ? (
        <p className="max-w-xs text-xs text-green-700">{state.message}</p>
      ) : null}
      {state.kind === "error" ? (
        <p className="max-w-xs text-xs text-[var(--color-accent)]">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
