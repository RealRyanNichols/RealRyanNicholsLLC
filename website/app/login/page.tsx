"use client";

import { useState, useMemo, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type Tab = "password" | "magic" | "create";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/admin";

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function clearStatus() {
    setError(null);
    setInfo(null);
  }

  async function handleGoogle() {
    clearStatus();
    setBusy(true);
    const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(
      next,
    )}`;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    clearStatus();
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleMagic(e: FormEvent) {
    e.preventDefault();
    clearStatus();
    setBusy(true);
    const emailRedirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(
      next,
    )}`;
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo("Check your email for the sign-in link.");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    clearStatus();
    setBusy(true);
    const emailRedirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(
      next,
    )}`;
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo("Account created. Check your email to confirm and finish sign-in.");
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16 text-neutral-900">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Authorized accounts only.
        </p>
      </header>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="flex items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
      >
        <GoogleGlyph />
        Sign in with Google
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-neutral-500">
        <span className="h-px flex-1 bg-neutral-200" />
        or
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <nav className="flex gap-1 rounded-lg bg-neutral-100 p-1 text-sm font-medium">
        <TabButton active={tab === "password"} onClick={() => setTab("password")}>
          Password
        </TabButton>
        <TabButton active={tab === "magic"} onClick={() => setTab("magic")}>
          Magic link
        </TabButton>
        <TabButton active={tab === "create"} onClick={() => setTab("create")}>
          Create account
        </TabButton>
      </nav>

      {tab === "password" && (
        <form onSubmit={handlePassword} className="flex flex-col gap-3">
          <EmailField value={email} onChange={setEmail} />
          <PasswordField value={password} onChange={setPassword} />
          <SubmitButton busy={busy}>Sign in</SubmitButton>
        </form>
      )}

      {tab === "magic" && (
        <form onSubmit={handleMagic} className="flex flex-col gap-3">
          <EmailField value={email} onChange={setEmail} />
          <SubmitButton busy={busy}>Send magic link</SubmitButton>
        </form>
      )}

      {tab === "create" && (
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <EmailField value={email} onChange={setEmail} />
          <PasswordField value={password} onChange={setPassword} />
          <SubmitButton busy={busy}>Create account</SubmitButton>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {info}
        </p>
      )}
    </main>
  );
}

function TabButton({
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
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 transition ${
        active
          ? "bg-white text-neutral-900 shadow-sm"
          : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      {children}
    </button>
  );
}

function EmailField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-neutral-700">Email</span>
      <input
        type="email"
        autoComplete="email"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900"
      />
    </label>
  );
}

function PasswordField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-neutral-700">Password</span>
      <input
        type="password"
        autoComplete="current-password"
        required
        minLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900"
      />
    </label>
  );
}

function SubmitButton({
  busy,
  children,
}: {
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
    >
      {busy ? "Working…" : children}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86a5.27 5.27 0 0 1-4.95-3.65H.96v2.29A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M4.05 10.77a5.41 5.41 0 0 1 0-3.54V4.94H.96a9 9 0 0 0 0 8.12l3.09-2.29z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.09 2.29A5.27 5.27 0 0 1 9 3.58z"
      />
    </svg>
  );
}
