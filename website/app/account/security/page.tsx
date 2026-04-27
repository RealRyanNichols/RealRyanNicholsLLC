"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type Identity = { provider: string };

export default function AccountSecurityPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState<string | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase.auth.getUser();
      if (cancelled) return;
      if (err || !data.user) {
        router.push("/login?next=/account/security");
        return;
      }
      setEmail(data.user.email ?? null);
      setIdentities(
        (data.user.identities ?? []).map((i) => ({ provider: i.provider })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setInfo("Password updated. You can now sign in with email + password.");
  }

  if (!email) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-neutral-600">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16 text-neutral-900">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Account security</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Signed in as <span className="font-medium">{email}</span>
        </p>
        {identities.length > 0 && (
          <p className="mt-1 text-xs text-neutral-500">
            Linked identities: {identities.map((i) => i.provider).join(", ")}
          </p>
        )}
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Set or change password</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>

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
