"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
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

type J6Match = {
  person_id: string;
  slug: string;
  name: string;
  role: string | null;
  claim_status: string;
  score: number;
};

type Action =
  | "approve"
  | "deny"
  | "ask_info"
  | "ban"
  | "reset_pending"
  | "supporter_on"
  | "supporter_off";

export function UserModerationRow({
  profile,
  j6Matches = [],
}: {
  profile: Profile;
  j6Matches?: J6Match[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [note, setNote] = useState(profile.admin_notes ?? "");

  async function update(patch: Record<string, unknown>) {
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
      setAskOpen(false);
      setNoteOpen(false);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  function runAction(action: Action) {
    if (action === "approve") {
      update({
        status: "active",
        verified_at: new Date().toISOString(),
        verified_linked_account: true,
      });
    } else if (action === "deny") {
      if (!confirm(`Deny @${profile.username ?? profile.id}? They keep their account but can't comment or claim.`)) {
        return;
      }
      update({ status: "denied" });
    } else if (action === "ban") {
      if (!confirm(`Ban @${profile.username ?? profile.id}? Stronger than deny — they're flagged as bad actor.`)) {
        return;
      }
      update({ status: "banned" });
    } else if (action === "reset_pending") {
      update({ status: "pending" });
    } else if (action === "supporter_on") {
      update({
        is_supporter: true,
        supporter_since: new Date().toISOString(),
      });
    } else if (action === "supporter_off") {
      update({ is_supporter: false, supporter_since: null });
    }
  }

  function submitQuestion() {
    const q = question.trim();
    if (!q) return;
    const stamp = format(new Date(), "yyyy-MM-dd HH:mm");
    const appended = profile.admin_notes
      ? `${profile.admin_notes}\n\n[${stamp}] Q: ${q}`
      : `[${stamp}] Q: ${q}`;
    update({
      status: "info_requested",
      admin_notes: appended,
    });
  }

  function saveNote() {
    update({ admin_notes: note.trim() || null });
  }

  async function linkToJ6Profile(personId: string, personName: string) {
    if (
      !confirm(
        `Link ${profile.full_name ?? profile.email} to ${personName}? This approves the user, verifies the J6 profile to them, and rejects any other pending claims on that profile.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}/link-j6`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: personId }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Link failed.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link failed.");
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
              <span className="text-xs text-[var(--color-accent)]">(no username)</span>
            )}
            <StatusBadge status={profile.status} verified={verified} />
            {profile.is_supporter ? <SupporterBadge size="xs" /> : null}
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)] space-y-0.5">
            <div>
              <span className="text-[var(--color-ink-soft)]">Real name:</span>{" "}
              <span className="font-mono">
                {profile.full_name ?? <em className="text-[var(--color-accent)]">missing</em>}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-ink-soft)]">Email:</span>{" "}
              <a
                href={`mailto:${profile.email}`}
                className="font-mono text-[var(--color-accent)] hover:underline"
              >
                {profile.email || "—"}
              </a>
            </div>
            {profile.location ? (
              <div>
                <span className="text-[var(--color-ink-soft)]">Location:</span>{" "}
                {profile.location}
              </div>
            ) : null}
            <div>
              <span className="text-[var(--color-ink-soft)]">Joined:</span>{" "}
              <span title={format(new Date(profile.created_at), "yyyy-MM-dd HH:mm:ss")}>
                {formatDistanceToNowStrict(new Date(profile.created_at), { addSuffix: true })}
                {" · "}
                {format(new Date(profile.created_at), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          {profile.bio ? (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
              {profile.bio}
            </p>
          ) : null}
          {j6Matches.length > 0 ? (
            <div className="mt-3 rounded-lg border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-blue)]">
                Possible J6 profile matches
              </p>
              <ul className="mt-2 space-y-1.5">
                {j6Matches.map((m) => {
                  const pct = Math.round(m.score * 100);
                  const claimed = m.claim_status === "verified";
                  const strong = m.score >= 0.85;
                  return (
                    <li
                      key={m.person_id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/case/people/${m.slug}`}
                          target="_blank"
                          className="font-bold hover:text-[var(--color-accent)]"
                        >
                          {m.name}
                        </Link>
                        {m.role ? (
                          <span className="ml-2 text-xs text-[var(--color-muted)]">
                            {m.role}
                          </span>
                        ) : null}
                        <span
                          className={`ml-2 text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${
                            strong
                              ? "bg-[var(--color-success)] text-[var(--color-paper)]"
                              : "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]"
                          }`}
                        >
                          {pct}% match
                        </span>
                        {claimed ? (
                          <span className="ml-1 text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 bg-[var(--color-accent)] text-[var(--color-paper)]">
                            ALREADY CLAIMED
                          </span>
                        ) : null}
                      </div>
                      {!claimed ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => linkToJ6Profile(m.person_id, m.name)}
                          className="flex-shrink-0 rounded-md bg-[var(--color-blue)] hover:bg-[var(--color-blue-strong)] px-2.5 py-1 text-xs font-bold text-[var(--color-paper)] disabled:opacity-50"
                        >
                          🔗 Link
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[10px] text-[var(--color-muted)]">
                Linking sets the user to <strong>active</strong>, marks the J6
                profile <strong>verified</strong> to them, and auto-rejects any
                other pending claims on that profile.
              </p>
            </div>
          ) : null}
          {profile.admin_notes ? (
            <details className="mt-2">
              <summary className="text-xs font-bold text-[var(--color-muted)] cursor-pointer hover:text-[var(--color-accent)]">
                Admin notes ({profile.admin_notes.split("\n").filter((l) => l.trim()).length} lines)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-[var(--color-ink-soft)] bg-[var(--color-paper)] border border-[var(--color-line-soft)] rounded-md p-2 font-mono">
                {profile.admin_notes}
              </pre>
            </details>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-stretch flex-shrink-0 sm:min-w-[160px]">
          {profile.status !== "active" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction("approve")}
              className="rounded-md bg-[var(--color-success)] hover:opacity-90 px-3 py-1.5 text-xs font-bold text-[var(--color-paper)] disabled:opacity-60"
              title="Mark as verified and active"
            >
              ✓ Approve
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setAskOpen((v) => !v);
              setNoteOpen(false);
            }}
            className="rounded-md border-2 border-[var(--color-blue)] bg-[var(--color-blue)] hover:bg-[var(--color-blue-strong)] px-3 py-1.5 text-xs font-bold text-[var(--color-paper)] disabled:opacity-60"
            title="Save a question to ask this user before approving"
          >
            ? Ask Info
          </button>
          {profile.status !== "denied" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction("deny")}
              className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-2)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] px-3 py-1.5 text-xs font-bold disabled:opacity-60"
              title="Soft rejection — they keep their account but can't act"
            >
              ✗ Deny
            </button>
          ) : null}
          {profile.status !== "banned" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction("ban")}
              className="rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] px-3 py-1.5 text-xs font-bold text-[var(--color-paper)] disabled:opacity-60"
              title="Hard ban — bad actor"
            >
              🚫 Ban
            </button>
          ) : null}
          {profile.status !== "pending" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction("reset_pending")}
              className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
              title="Send back to pending review"
            >
              ↺ Reset to pending
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setNoteOpen((v) => !v);
              setAskOpen(false);
            }}
            className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            title="Add or edit private admin notes about this user"
          >
            📝 Note
          </button>
          {profile.is_supporter ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction("supporter_off")}
              className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              Un-supporter
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction("supporter_on")}
              className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              ★ Supporter
            </button>
          )}
        </div>
      </div>

      {askOpen ? (
        <div className="mt-3 border-t border-[var(--color-line)] pt-3">
          <p className="text-xs font-bold text-[var(--color-ink)] mb-1.5">
            What do you want to ask{" "}
            {profile.display_name ?? profile.full_name ?? "this user"}?
          </p>
          <p className="text-[11px] text-[var(--color-muted)] mb-2">
            Saved to admin notes (timestamped). User status → info_requested.
            Email them at <span className="font-mono">{profile.email}</span>.
          </p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="e.g. 'Can you send a photo of your pardon document?' or 'Which DOJ case # is yours?'"
            className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !question.trim()}
              onClick={submitQuestion}
              className="rounded-md bg-[var(--color-blue)] hover:bg-[var(--color-blue-strong)] px-3 py-1.5 text-xs font-bold text-[var(--color-paper)] disabled:opacity-50"
            >
              Save question & mark info_requested
            </button>
            <a
              href={`mailto:${profile.email}?subject=${encodeURIComponent(
                "Quick question about your realryannichols.com account",
              )}&body=${encodeURIComponent(question)}`}
              className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold inline-flex items-center"
            >
              Open in email →
            </a>
            <button
              type="button"
              onClick={() => {
                setAskOpen(false);
                setQuestion("");
              }}
              className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {noteOpen ? (
        <div className="mt-3 border-t border-[var(--color-line)] pt-3">
          <p className="text-xs font-bold text-[var(--color-ink)] mb-2">
            Admin notes (private)
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Anything you want to remember about this user."
            className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={saveNote}
              className="rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] px-3 py-1.5 text-xs font-bold text-[var(--color-paper)] disabled:opacity-50"
            >
              Save note
            </button>
            <button
              type="button"
              onClick={() => {
                setNoteOpen(false);
                setNote(profile.admin_notes ?? "");
              }}
              className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-[var(--color-accent)]">{error}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ status, verified }: { status: string; verified: boolean }) {
  const styles: Record<string, { bg: string; fg: string; label: string }> = {
    banned: { bg: "var(--color-accent)", fg: "var(--color-paper)", label: "BANNED" },
    denied: { bg: "var(--color-surface-2)", fg: "var(--color-muted)", label: "DENIED" },
    info_requested: { bg: "var(--color-blue)", fg: "var(--color-paper)", label: "INFO ASKED" },
    pending: { bg: "var(--color-tag-procedural)", fg: "var(--color-paper)", label: "PENDING" },
  };
  const s = styles[status];
  if (s) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold"
        style={{ background: s.bg, color: s.fg }}
      >
        {s.label}
      </span>
    );
  }
  if (verified) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold"
        style={{ background: "var(--color-success)", color: "var(--color-paper)" }}
      >
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
