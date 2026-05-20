"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function LoginPage() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "sending" });
    const supabase = getSupabaseBrowserClient();
    const redirect =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    });
    if (error) {
      setState({ kind: "error", message: error.message });
      return;
    }
    setState({ kind: "sent" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="text-[var(--color-ink-soft)] mt-2 text-sm">
        Magic link sign-in. We don&apos;t use passwords here.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl border border-[var(--color-line)] bg-white p-5"
      >
        <label htmlFor="login-email" className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
          Your email
        </label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={state.kind === "sending"}
          className="mt-3 w-full rounded-lg bg-[var(--color-ink)] px-4 py-2 text-white text-sm font-medium hover:bg-[var(--color-accent)] disabled:opacity-60 transition"
        >
          {state.kind === "sending" ? "Sending..." : "Email me a magic link"}
        </button>
        {state.kind === "sent" && (
          <p className="mt-3 text-sm text-emerald-700">
            Check your inbox for the sign-in link.
          </p>
        )}
        {state.kind === "error" && (
          <p className="mt-3 text-sm text-red-700">{state.message}</p>
        )}
      </form>
    </div>
  );
}
