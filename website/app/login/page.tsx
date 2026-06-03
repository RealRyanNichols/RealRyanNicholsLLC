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
  const next = sanitizeNext(params.get("next"));
  const modeParam = params.get("mode");
  const initialMode: Mode =
    modeParam === "signup" || modeParam === "magic" || modeParam === "signin"
      ? modeParam
      : "signin";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    setState({ kind: "idle" });
  }, [mode]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "submitting" });
    const supabase = getSupabaseBrowserClient();
    const callbackPath = `/auth/callback?next=${encodeURIComponent(next)}`;
    const redirect =
      typeof window !== "undefined"
        ? `${window.location.origin}${callbackPath}`
        : undefined;

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          // Friendlier error copy than Supabase defaults.
          if (/email not confirmed/i.test(error.message)) {
            throw new Error(
              "Your email isn't confirmed yet. Check your inbox for the confirmation link, or use Email link below to sign in directly.",
            );
          }
          if (/invalid login credentials/i.test(error.message)) {
            throw new Error(
              "Email or password is wrong. If you just created an account, try Email link below and we'll send a sign-in link.",
            );
          }
          throw error;
        }
        router.push(next);
        router.refresh();
        return;
      }
      if (mode === "signup") {
        if (!fullName.trim() || !displayName.trim() || !username.trim()) {
          throw new Error("Full name, display name, and username are required.");
        }
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/.test(username)) {
          throw new Error(
            "Username must be 3–30 characters, letters/numbers/underscore/dash, not starting with a dash."
          );
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirect,
            data: {
              full_name: fullName.trim(),
              display_name: displayName.trim(),
              username: username.trim().toLowerCase(),
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
          return;
        }
        // Defensive fallback: if no session came back for any reason, sign
        // them in with the password they just set so they don't bounce.
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) {
          setState({
            kind: "sent",
            message:
              "Account created. Check your email if Supabase asks you to confirm, then sign in with the password you just set.",
          });
          return;
        }
        router.push(next);
        router.refresh();
        return;
      }
      // magic
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirect },
      });
      if (error) throw error;
      setState({ kind: "sent", message: "Check your inbox for the sign-in link. It will bring you back here." });
    } catch (err) {
      const m = err instanceof Error ? err.message : "Something went wrong.";
      setState({ kind: "error", message: m });
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-7 px-4 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Join the record
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {mode === "signup" ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-ink-soft)]">
          {mode === "signin"
            ? "Use your account to comment, track your profile, and keep your voice tied to one real person."
            : mode === "signup"
              ? "Comment on the site, speak your mind, and bring the opinions other platforms bury. No paywall. Real account, real voice, public record."
              : "Email-only sign-in. We send a one-time link that brings you back to the page you were trying to reach."}
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
            Email link
          </Tab>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
        >
        {mode === "signup" ? (
          <>
            <label htmlFor="login-fullname" className="text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
              Full legal name
            </label>
            <input
              id="login-fullname"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="First Middle Last"
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              Required. Only admins see this — used to verify you&apos;re a real person, not a sockpuppet.
            </p>

            <label htmlFor="login-displayname" className="mt-4 text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
              Display name
            </label>
            <input
              id="login-displayname"
              type="text"
              required
              maxLength={60}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you want to appear publicly"
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />

            <label htmlFor="login-username" className="mt-4 text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              required
              minLength={3}
              maxLength={30}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
              placeholder="e.g. johnsmith"
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              Lowercase letters, numbers, dash, underscore. Becomes your URL: /u/{username || "yourname"}
            </p>
          </>
        ) : null}

        <label
          htmlFor="login-email"
          className={`${mode === "signup" ? "mt-4 " : ""}text-xs uppercase tracking-wider text-[var(--color-muted)] block mb-2`}
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
                At least 8 characters. If email confirmation is required, use the link we send; otherwise you can enter your account right away.
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
          <p className="mt-3 text-sm text-[var(--color-accent)]">{state.message}</p>
        ) : null}
        </form>

        {mode === "signin" ? (
          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
            Forgot your password?{" "}
            <button
              type="button"
              onClick={() => setMode("magic")}
              className="text-[var(--color-accent)] underline underline-offset-4"
            >
              Use an email link instead
            </button>
            .
          </p>
        ) : null}
      </section>

      <aside className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Why make one?
        </p>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          <li>
            <strong className="text-[var(--color-ink)]">Comment here.</strong>{" "}
            Say what you think without feeding the platforms that cancel people.
          </li>
          <li>
            <strong className="text-[var(--color-ink)]">Keep a public profile.</strong>{" "}
            Your display name and username stay tied to your comments.
          </li>
          <li>
            <strong className="text-[var(--color-ink)]">Help build the record.</strong>{" "}
            Good comments, claims, tips, and receipts become easier to review.
          </li>
          <li>
            <strong className="text-[var(--color-ink)]">No trick paywall.</strong>{" "}
            Reading stays free. Accounts are for trust, comments, and continuity.
          </li>
        </ul>
      </aside>
    </div>
  );
}

function sanitizeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
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
          ? "bg-[var(--color-accent)] text-[var(--color-paper)]"
          : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
