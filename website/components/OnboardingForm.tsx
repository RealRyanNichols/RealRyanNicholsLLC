"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "error";

export function OnboardingForm({
  defaultFullName,
  defaultDisplayName,
  defaultUsername,
  nextHref,
}: {
  defaultFullName: string;
  defaultDisplayName: string;
  defaultUsername: string;
  nextHref: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [fullName, setFullName] = useState(defaultFullName);
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [username, setUsername] = useState(defaultUsername);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErr(null);

    const trimmedFull = fullName.trim();
    const trimmedDisplay = displayName.trim();
    const trimmedUser = username.trim().toLowerCase();

    if (!trimmedFull) {
      setStatus("error");
      setErr("Full legal name is required.");
      return;
    }
    if (trimmedFull.split(/\s+/).length < 2) {
      setStatus("error");
      setErr("Use your real first AND last name.");
      return;
    }
    if (!trimmedDisplay) {
      setStatus("error");
      setErr("Display name is required.");
      return;
    }
    if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(trimmedUser)) {
      setStatus("error");
      setErr(
        "Username: 3–30 chars, lowercase letters / numbers / dash / underscore. Can't start with a dash.",
      );
      return;
    }

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: trimmedFull,
          display_name: trimmedDisplay,
          username: trimmedUser,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErr(json.error ?? "Could not save your profile.");
        return;
      }
      // Hard-navigate so the middleware re-evaluates the new profile state.
      window.location.href = nextHref;
    } catch {
      setStatus("error");
      setErr("Network error. Try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5"
    >
      <div>
        <label
          htmlFor="ob-fullname"
          className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold mb-1.5"
        >
          Full legal name <span className="text-[var(--color-accent)]">*</span>
        </label>
        <input
          id="ob-fullname"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="First Middle Last"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]"
        />
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          Required. Not shown publicly — only Ryan sees this to verify you&apos;re
          a real person.
        </p>
      </div>

      <div>
        <label
          htmlFor="ob-display"
          className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold mb-1.5"
        >
          Display name <span className="text-[var(--color-accent)]">*</span>
        </label>
        <input
          id="ob-display"
          type="text"
          required
          maxLength={60}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How you want to appear publicly"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]"
        />
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          What everyone sees on your comments and posts.
        </p>
      </div>

      <div>
        <label
          htmlFor="ob-username"
          className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold mb-1.5"
        >
          Username <span className="text-[var(--color-accent)]">*</span>
        </label>
        <div className="flex items-stretch rounded-lg border border-[var(--color-line)] overflow-hidden focus-within:border-[var(--color-accent)]">
          <span className="inline-flex items-center px-3 bg-[var(--color-surface-2)] text-sm text-[var(--color-muted)] font-mono">
            /u/
          </span>
          <input
            id="ob-username"
            type="text"
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase(),
              )
            }
            placeholder="johnsmith"
            className="flex-1 bg-[var(--color-paper)] px-3 py-2.5 text-base font-mono focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          3–30 chars, lowercase / numbers / dash / underscore.
        </p>
      </div>

      {err ? (
        <p className="text-sm text-[var(--color-accent)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)] rounded-lg px-3 py-2">
          {err}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-4 font-bold text-lg hover:bg-[var(--color-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {status === "submitting" ? "Saving…" : "Save & continue →"}
      </button>
    </form>
  );
}
