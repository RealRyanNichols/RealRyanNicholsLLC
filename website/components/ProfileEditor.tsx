"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Initial = {
  id: string;
  display_name: string;
  full_name: string;
  username: string;
  bio: string;
  location: string;
};

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

export function ProfileEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [fullName, setFullName] = useState(initial.full_name);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setState({ kind: "error", message: "Full legal name is required." });
      return;
    }
    if (!displayName.trim()) {
      setState({ kind: "error", message: "Display name is required." });
      return;
    }
    if (!username.trim() || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/.test(username)) {
      setState({
        kind: "error",
        message:
          "Username: 3–30 chars, letters/numbers/dash/underscore, doesn't start with a dash.",
      });
      return;
    }
    setState({ kind: "saving" });
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim() || null,
          location: location.trim() || null,
        })
        .eq("id", initial.id);
      if (error) throw new Error(error.message);
      setState({ kind: "saved" });
      router.refresh();
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Save failed.",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5"
    >
      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
          Full legal name *
        </label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="First Middle Last"
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
        />
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          Admin sees this. Not public. Required for verification.
        </p>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
          Display name *
        </label>
        <input
          type="text"
          required
          maxLength={60}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How you want to appear publicly"
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
          Username *
        </label>
        <input
          type="text"
          required
          minLength={3}
          maxLength={30}
          value={username}
          onChange={(e) =>
            setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))
          }
          placeholder="e.g. johnsmith"
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-mono"
        />
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          Public profile URL: /u/{username || "yourname"}
        </p>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
          Bio
        </label>
        <textarea
          maxLength={500}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A sentence or two about you."
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
          Location
        </label>
        <input
          type="text"
          maxLength={80}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, State"
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={state.kind === "saving"}
        className="btn-accent rounded-full px-5 py-2 text-sm font-bold disabled:opacity-60"
      >
        {state.kind === "saving" ? "Saving…" : "Save profile"}
      </button>

      {state.kind === "saved" ? (
        <p className="text-sm text-emerald-400">Saved ✓</p>
      ) : null}
      {state.kind === "error" ? (
        <p className="text-sm text-[var(--color-accent)]">{state.message}</p>
      ) : null}
    </form>
  );
}
