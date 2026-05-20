"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SupporterBadge } from "@/components/SupporterBadge";

type Profile = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  location: string | null;
  status: string;
  verified_at: string | null;
  verified_linked_account: boolean;
  admin_notes: string | null;
  is_supporter?: boolean;
  created_at: string;
  email: string;
};

export function UserModerationRow({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(patch: Partial<Profile>) {
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updErr } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", profile.id);
      if (updErr) throw new Error(updErr.message);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const verified = !!profile.verified_at || profile.verified_linked_account;

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold">{profile.display_name ?? "(no display name)"}</span>
            {profile.username ? (
              <Link
                href={`/u/${profile.username}`}
                target="_blank"
                className="text-xs font-mono text-[var(--color-muted)] hover:text-[var(--color-accent)]"
              >
                @{profile.username}
              </Link>
            ) : (
              <span className="text-xs text-amber-400">(no username)</span>
            )}
            <StatusBadge status={profile.status} verified={verified} />
            {profile.is_supporter ? <SupporterBadge size="xs" /> : null}
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)] space-y-0.5">
            <div>
              <span className="text-[var(--color-ink-soft)]">Real name:</span>{" "}
              <span className="font-mono">
                {profile.full_name ?? <em className="text-amber-400">missing</em>}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-ink-soft)]">Email:</span>{" "}
              <span className="font-mono">{profile.email || "—"}</span>
            </div>
            {profile.location ? (
              <div>
                <span className="text-[var(--color-ink-soft)]">Location:</span>{" "}
                {profile.location}
              </div>
            ) : null}
            <div>
              <span className="text-[var(--color-ink-soft)]">Joined:</span>{" "}
              {format(new Date(profile.created_at), "MMM d, yyyy h:mma")}
            </div>
          </div>
          {profile.bio ? (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
              {profile.bio}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-stretch flex-shrink-0">
          {profile.status !== "active" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                update({
                  status: "active",
                  verified_at: new Date().toISOString(),
                  verified_linked_account: true,
                })
              }
              className="rounded-full bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              ✓ Verify
            </button>
          ) : null}
          {profile.status !== "pending" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => update({ status: "pending" })}
              className="rounded-full bg-amber-700 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              Un-verify
            </button>
          ) : null}
          {profile.status !== "banned" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirm(`Ban @${profile.username ?? profile.id}?`)) {
                  update({ status: "banned" });
                }
              }}
              className="rounded-full bg-red-800 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              Ban
            </button>
          ) : null}
          {profile.is_supporter ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                update({ is_supporter: false, supporter_since: null } as Partial<Profile>)
              }
              className="rounded-full border border-amber-700 text-amber-300 px-3 py-1.5 text-xs font-bold disabled:opacity-60"
            >
              Un-supporter
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                update({
                  is_supporter: true,
                  supporter_since: new Date().toISOString(),
                } as Partial<Profile>)
              }
              className="rounded-full bg-amber-700 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              ★ Mark Supporter
            </button>
          )}
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ status, verified }: { status: string; verified: boolean }) {
  if (status === "banned") {
    return (
      <span className="rounded-full bg-red-950/50 border border-red-700 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold text-red-300">
        banned
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="rounded-full bg-amber-950/40 border border-amber-700 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold text-amber-300">
        pending
      </span>
    );
  }
  if (verified) {
    return (
      <span className="rounded-full bg-emerald-950/40 border border-emerald-700 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold text-emerald-300">
        ✓ verified
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--color-surface-2)] border border-[var(--color-line)] px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
      active
    </span>
  );
}
