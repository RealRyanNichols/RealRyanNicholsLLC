"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSessionId, getVisitorId } from "@/lib/client-ids";
import { trackEvent } from "@/lib/analytics";

// One-tap reader poll. Voting is free and anonymous (same session id the
// page tracker uses). The live breakdown is locked behind an email — one
// unlock opens results on every poll, site-wide, for that visitor.
//
// Drop into markdown as {{poll: Question? | Option A | Option B | Option C}}
// or render directly with a poll_key (feed polls from /admin/polls).

type State = {
  found: boolean;
  question?: string;
  options?: string[];
  status?: "open" | "closed";
  total?: number;
  mine?: number | null;
  unlocked?: boolean;
  counts?: number[] | null;
};

export function PollCard({
  pollKey,
  question,
  options,
  kicker = "Reader poll",
}: {
  pollKey: string;
  question: string;
  options: string[];
  kicker?: string;
}) {
  const [st, setSt] = useState<State>({ found: false });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sid = useRef<string>("");
  const vid = useRef<string>("");

  const apply = useCallback((p: State) => {
    if (p && typeof p === "object") setSt(p);
  }, []);

  useEffect(() => {
    sid.current = getSessionId();
    vid.current = getVisitorId();
    const supabase = getSupabaseBrowserClient();
    supabase
      .rpc("poll_state", {
        p_poll_key: pollKey,
        p_session_id: sid.current,
        p_visitor_id: vid.current || null,
      })
      .then(({ data }) => {
        if (data) apply(data as State);
      });
  }, [pollKey, apply]);

  const vote = useCallback(
    async (idx: number) => {
      if (!sid.current) sid.current = getSessionId();
      if (!vid.current) vid.current = getVisitorId();
      // Optimistic: mark my pick and bump the total.
      setSt((prev) => ({
        ...prev,
        found: true,
        mine: idx,
        total: (prev.total ?? 0) + (prev.mine == null ? 1 : 0),
      }));
      trackEvent("poll_vote", {
        poll_key: pollKey.slice(0, 120),
        option_idx: idx,
        option: (options[idx] ?? "").slice(0, 80),
      });
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.rpc("poll_vote", {
        p_poll_key: pollKey,
        p_question: question,
        p_options: options,
        p_option_idx: idx,
        p_session_id: sid.current,
        p_visitor_id: vid.current || null,
        p_path: typeof window !== "undefined" ? window.location.pathname : null,
      });
      if (data) apply(data as State);
    },
    [pollKey, question, options, apply],
  );

  const unlock = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (busy) return;
      setErr(null);
      setBusy(true);
      try {
        const res = await fetch("/api/poll-unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            sessionId: sid.current || getSessionId(),
            visitorId: vid.current || getVisitorId() || null,
            pollKey,
            path:
              typeof window !== "undefined" ? window.location.pathname : null,
          }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;
        if (!res.ok || !data?.ok) {
          setErr(data?.error ?? "Could not unlock. Try again.");
          return;
        }
        trackEvent("poll_unlock", { poll_key: pollKey.slice(0, 120) });
        const supabase = getSupabaseBrowserClient();
        const { data: fresh } = await supabase.rpc("poll_state", {
          p_poll_key: pollKey,
          p_session_id: sid.current,
          p_visitor_id: vid.current || null,
        });
        if (fresh) apply(fresh as State);
      } finally {
        setBusy(false);
      }
    },
    [busy, email, pollKey, apply],
  );

  const opts = st.options ?? options;
  const total = st.total ?? 0;
  const voted = st.mine != null;
  const unlocked = Boolean(st.unlocked && Array.isArray(st.counts));
  const closed = st.status === "closed";

  return (
    <div className="rounded-2xl border border-[var(--color-line)] border-l-4 border-l-[var(--color-gold)] bg-[var(--color-surface)] p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-navy)]">
          {kicker}
          {closed ? " · closed" : ""}
        </p>
        {total > 0 ? (
          <span className="whitespace-nowrap font-mono text-xs font-bold tabular-nums text-[var(--color-muted)]">
            {total.toLocaleString()} {total === 1 ? "vote" : "votes"} in
          </span>
        ) : null}
      </div>
      <p className="mb-3 text-base font-bold leading-snug text-[var(--color-ink)]">
        {question}
      </p>

      {!voted && !closed ? (
        <div className="space-y-2">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--color-gold-soft)] px-2 py-1 text-[11px] font-black uppercase tracking-wider text-[var(--color-support-strong)]">
            Tap your answer to vote
          </p>
          {opts.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => vote(idx)}
              className="group flex w-full items-center gap-3 rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 text-left text-sm font-bold text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-gold)] hover:bg-[var(--color-gold-soft)] active:scale-[0.99]"
            >
              <span
                aria-hidden
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-[var(--color-gold)] transition group-hover:bg-[var(--color-gold)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-gold)] transition group-hover:bg-[var(--color-paper)]" />
              </span>
              <span className="min-w-0 flex-1">{label}</span>
              <span
                aria-hidden
                className="shrink-0 text-base font-black text-[var(--color-support-strong)] opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100"
              >
                →
              </span>
            </button>
          ))}
          <p className="pt-1 text-xs text-[var(--color-muted)]">
            One tap. Free and anonymous. No signup to vote.
          </p>
        </div>
      ) : null}

      {(voted || closed) && unlocked ? (
        <div className="space-y-2">
          {opts.map((label, idx) => {
            const n = st.counts?.[idx] ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            const mine = st.mine === idx;
            return (
              <div key={idx} className="relative overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]">
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-[var(--color-gold-soft)] transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className={`text-sm ${mine ? "font-bold text-[var(--color-support-strong)]" : "font-semibold text-[var(--color-ink-soft)]"}`}>
                    {label}
                    {mine ? " ✓" : ""}
                  </span>
                  <span className="whitespace-nowrap font-mono text-xs font-bold tabular-nums text-[var(--color-ink)]">
                    {pct}% · {n.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-xs text-[var(--color-muted)]">
            Live count. The record updates as votes come in.
          </p>
        </div>
      ) : null}

      {(voted || closed) && !unlocked ? (
        <div>
          <div className="space-y-2" aria-hidden>
            {opts.map((label, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--color-gold-soft)] blur-[6px]"
                  style={{ width: `${28 + ((idx * 37) % 45)}%` }}
                />
                <div className="relative flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className={`text-sm ${st.mine === idx ? "font-bold text-[var(--color-support-strong)]" : "font-semibold text-[var(--color-ink-soft)]"}`}>
                    {label}
                    {st.mine === idx ? " ✓ your vote" : ""}
                  </span>
                  <span className="select-none font-mono text-xs font-bold tabular-nums text-[var(--color-muted)] blur-sm">
                    ··%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={unlock} className="mt-3 border-l-2 border-[#e1bd5b] bg-[var(--color-surface-2)] p-3">
            <p className="text-sm font-bold text-[var(--color-ink)]">
              Your vote is in. The breakdown is locked.
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
              Drop your email and I&apos;ll open the live results — every poll on
              the site, unlocked.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="submit"
                disabled={busy}
                className="btn-accent whitespace-nowrap px-4 py-2 text-sm disabled:opacity-60"
              >
                {busy ? "Unlocking…" : "See results"}
              </button>
            </div>
            {err ? (
              <p className="mt-1.5 text-xs font-semibold text-red-600">{err}</p>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}
