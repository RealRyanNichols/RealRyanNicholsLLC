"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

type Candidate = {
  id: string;
  slug: string;
  display_name: string;
  aliases: string[] | null;
  seed_rank: number | null;
  is_seeded: boolean;
  case_person_id: string | null;
  editorial_note: string | null;
  vote_count: number;
  profile_slug: string | null;
  photo_url: string | null;
  role: string | null;
};

type Props = {
  initialCandidates: Candidate[];
  signedIn: boolean;
  verifiedEmail: boolean;
  activeVoteId: string | null;
};

export function J6Top25Ballot({
  initialCandidates,
  signedIn,
  verifiedEmail,
  activeVoteId,
}: Props) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [selectedId, setSelectedId] = useState(activeVoteId);
  const [writeIn, setWriteIn] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ranked = useMemo(
    () =>
      [...candidates].sort((a, b) => {
        if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count;
        if (a.is_seeded !== b.is_seeded) return a.is_seeded ? -1 : 1;
        return (a.seed_rank ?? 9999) - (b.seed_rank ?? 9999);
      }),
    [candidates]
  );

  async function submitVote(candidateId: string) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/j6/top-25/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error ?? "Your vote could not be recorded.");
        return;
      }
      setCandidates((current) =>
        current.map((candidate) => ({
          ...candidate,
          vote_count:
            candidate.id === candidateId
              ? candidate.vote_count + (selectedId === candidateId ? 0 : 1)
              : candidate.id === selectedId
                ? Math.max(0, candidate.vote_count - 1)
                : candidate.vote_count,
        }))
      );
      setSelectedId(candidateId);
      setMessage("Your active vote has been recorded.");
    });
  }

  async function submitWriteIn() {
    const name = writeIn.trim();
    if (name.length < 3) {
      setMessage("Enter the person’s full name.");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/j6/top-25/write-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error ?? "The write-in could not be submitted.");
        return;
      }
      const candidate = payload.candidate as Candidate;
      setCandidates((current) => {
        const oldVote = selectedId;
        const withoutDuplicate = current.filter((item) => item.id !== candidate.id);
        return [
          ...withoutDuplicate.map((item) =>
            item.id === oldVote
              ? { ...item, vote_count: Math.max(0, item.vote_count - 1) }
              : item
          ),
          candidate,
        ];
      });
      setSelectedId(candidate.id);
      setWriteIn("");
      setMessage(`${candidate.display_name} was added and received your vote.`);
    });
  }

  const loginHref = "/login?next=/j6/top-25";

  return (
    <section className="mt-10">
      {!signedIn ? (
        <div className="mb-7 rounded-2xl border-2 border-[var(--color-gold)] bg-[var(--color-surface-2)] p-5 text-[var(--color-ink)]">
          <p className="font-black">Sign in to vote.</p>
          <p className="mt-1 text-sm leading-relaxed">
            Voting requires an account with a confirmed email address so each person has one active vote.
          </p>
          <Link href={loginHref} className="btn-blue mt-4 inline-flex rounded-xl px-5 py-3 text-sm font-black">
            Sign in or register →
          </Link>
        </div>
      ) : !verifiedEmail ? (
        <div className="mb-7 rounded-2xl border-2 border-[var(--color-tag-procedural)]/50 bg-[var(--color-support-soft)] p-5 text-[var(--color-tag-procedural)]">
          <p className="font-black">Confirm your email before voting.</p>
          <p className="mt-1 text-sm leading-relaxed">
            Open the confirmation email sent when your account was created, then return to this page.
          </p>
        </div>
      ) : null}

      {message ? (
        <div aria-live="polite" className="mb-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {ranked.slice(0, 25).map((candidate, index) => {
          const selected = selectedId === candidate.id;
          return (
            <article
              key={candidate.id}
              id={candidate.slug}
              className={`relative overflow-hidden rounded-2xl border-2 p-4 transition ${
                selected
                  ? "border-[var(--color-gold)] bg-[var(--color-surface-2)] shadow-lg"
                  : "border-[var(--color-line)] bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex gap-4">
                <div className="display flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] text-2xl text-[var(--color-gold)]">
                  {index + 1}
                </div>
                {candidate.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={candidate.photo_url}
                    alt={`${candidate.display_name} profile`}
                    className="h-20 w-16 shrink-0 rounded-xl border border-[var(--color-line)] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--color-blue-soft)] text-xl font-black text-[var(--color-blue-ink)]">
                    {candidate.display_name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-black leading-tight">{candidate.display_name}</h2>
                      {candidate.role ? (
                        <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{candidate.role}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-black text-[var(--color-gold)]">
                      {candidate.vote_count.toLocaleString()} {candidate.vote_count === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                  {candidate.editorial_note ? (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">{candidate.editorial_note}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {candidate.profile_slug ? (
                      <Link
                        href={`/case/people/${candidate.profile_slug}`}
                        className="inline-flex min-h-11 items-center rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs font-black hover:border-[var(--color-gold)]"
                      >
                        View profile
                      </Link>
                    ) : (
                      <span className="rounded-lg border border-dashed border-[var(--color-line)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)]">
                        Profile being built
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={!signedIn || !verifiedEmail || isPending || selected}
                      onClick={() => submitVote(candidate.id)}
                      className="btn-blue min-h-11 rounded-lg px-4 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {selected ? "Your vote" : isPending ? "Saving…" : "Vote"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-10 rounded-3xl border-2 border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]" data-reveal>
        <p className="eyebrow">Do not see your choice?</p>
        <h2 className="mt-2 font-display text-3xl font-black">Write someone in.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Enter a full name. A write-in becomes part of the live ranking and receives your active vote. Duplicate names and obvious aliases are consolidated during review.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={writeIn}
            onChange={(event) => setWriteIn(event.target.value)}
            disabled={!signedIn || !verifiedEmail || isPending}
            maxLength={120}
            placeholder="Full name"
            className="min-h-12 flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4"
          />
          <button
            type="button"
            onClick={submitWriteIn}
            disabled={!signedIn || !verifiedEmail || isPending}
            className="btn-accent min-h-12 rounded-xl px-6 font-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add write-in and vote
          </button>
        </div>
      </section>
    </section>
  );
}
