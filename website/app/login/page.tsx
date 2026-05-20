"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "signin" | "signup" | "magic";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent"; message: string }
  | { kind: "error"; message: string };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-sm text-[var(--color-muted)]">Loading…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const [mode, setMode] = useState<Mode>("signin");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setState({ kind: "idle" });
  }, [mode]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "submitting" });
    const supabase = getSupabaseBrowserClient();
    const redirect =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        setState({
          kind: "sent",
          message:
            "Account created. Check your inbox for the confirmation link.",
        });
        return;
      }
      // magic
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirect },
      });
      if (error) throw error;
      setState({ kind: "sent", message: "Check your inbox for the sign-in link." });
    } catch (err) {
      const m = err instanceof Error ? err.message : "Something went wrong.";
      setState({ kind: "error", message: m });
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
        {mode === "signup" ? "Create account" : "Sign in"}
      </h1>
      <p className="text-[var(--color-ink-soft)] mt-2 text-sm">
        {mode === "signin"
          ? "Use the email and password you set up here, or switch to a magic link."
          : mode === "signup"
            ? "Pick a password. You'll get an email to confirm your address."
            : "Email-only sign-in. We'll send a one-time link."}
      </p>

      <div
        className="mt-5 inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] p-1 text-xs"
        role="tablist"
      >
        <Tab active={mode === "signin"} onClick={() => setMode("signin")}>
          Sign in
        </Tab>
        <Tab active={mode === "signup"} onClick={() => setMode("signup")}>
          Create account
        </Tab>
        <Tab active={mode === "magic"} onClick={() => setMode("magic")}>
          Magic link
        </Tab>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
      >
        <label
          htmlFor="login-email"
          className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />

        {mode !== "magic" ? (
          <>
            <label
              htmlFor="login-password"
              className="mt-4 text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
            {mode === "signup" ? (
              <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                At least 8 characters.
              </p>
            ) : null}
          </>
        ) : null}

        <button
          type="submit"
          disabled={state.kind === "submitting"}
          className="btn-accent mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60"
        >
          {state.kind === "submitting"
            ? "Working…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Email me a magic link"}
        </button>

        {state.kind === "sent" ? (
          <p className="mt-3 text-sm text-emerald-400">{state.message}</p>
        ) : null}
        {state.kind === "error" ? (
          <p className="mt-3 text-sm text-red-400">{state.message}</p>
        ) : null}
      </form>

      {mode === "signin" ? (
        <p className="mt-4 text-xs text-[var(--color-muted)] text-center">
          Forgot your password?{" "}
          <button
            type="button"
            onClick={() => setMode("magic")}
            className="text-[var(--color-accent)] underline underline-offset-4"
          >
            Use a magic link instead
          </button>
          .
        </p>
      ) : null}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full font-semibold transition",
        active
          ? "bg-[var(--color-accent)] text-[#0a0a0c]"
          : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
