"use client";

import { useState } from "react";

type Result =
  | { ok: true; message?: string; released?: number; blocked?: number; active?: boolean }
  | { ok: false; error: string };

type ApiResult = {
  ok?: boolean;
  message?: string;
  released?: number;
  blocked?: number;
  active?: boolean;
  error?: string;
};

export function DeadmanSwitchForm() {
  const [action, setAction] = useState<"activate" | "reverse">("activate");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/deadman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, code }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiResult;
      if (!res.ok) {
        setResult({ ok: false, error: json.error ?? "Request failed." });
        return;
      }
      setResult({
        ok: true,
        message: json.message,
        released: json.released,
        blocked: json.blocked,
        active: json.active,
      });
      setCode("");
    } catch {
      setResult({ ok: false, error: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-black text-[var(--color-ink)]">
            Action
          </span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as "activate" | "reverse")}
            className="w-full rounded-lg border border-[var(--color-line)] px-3 py-3 text-sm font-bold"
          >
            <option value="activate">Activate publishing mode</option>
            <option value="reverse">Reverse / turn off</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-black text-[var(--color-ink)]">
            Private code
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            type="password"
            autoComplete="off"
            minLength={16}
            className="w-full rounded-lg border border-[var(--color-line)] px-3 py-3 text-sm"
            placeholder="Enter the private switch code"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={busy || code.length < 16}
        className={[
          "mt-4 w-full rounded-lg px-5 py-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
          action === "activate"
            ? "bg-[var(--color-accent)] text-[var(--color-paper)] hover:bg-[var(--color-accent-strong)]"
            : "bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue-strong)]",
        ].join(" ")}
      >
        {busy ? "Working..." : action === "activate" ? "Activate switch" : "Turn switch off"}
      </button>
      {result ? (
        <div
          className={[
            "mt-4 rounded-lg border p-3 text-sm",
            result.ok
              ? "border-green-700/30 bg-green-700/10 text-[var(--color-ink)]"
              : "border-red-700/30 bg-red-700/10 text-red-800",
          ].join(" ")}
        >
          {result.ok ? (
            <p>
              {result.message ?? "Done."}
              {typeof result.released === "number"
                ? ` Released ${result.released} approved draft${result.released === 1 ? "" : "s"}.`
                : null}
              {typeof result.blocked === "number" && result.blocked > 0
                ? ` ${result.blocked} queued item${result.blocked === 1 ? "" : "s"} stayed blocked because the media is not ready.`
                : null}
            </p>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
