"use client";

import { useLivePulse, type Pulse } from "@/components/PostLivePulse";

// The single, audit-honest stats panel for a post page. It unifies what used
// to be three disconnected numbers (views icon, live-pulse line, share count)
// into one labeled block, and adds inbound shares. Every metric has a tooltip
// stating exactly what it counts — and what it does NOT.

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function PostStatsPanel({
  path,
  totalReach,
  shares,
  inboundShares,
  comments,
  seed,
}: {
  path: string;
  totalReach: number;
  shares: number;
  inboundShares: number;
  comments: number;
  seed?: Partial<Pulse>;
}) {
  const pulse = useLivePulse(path, seed);

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm">
      <ul className="space-y-2.5">
        <Row
          icon={<EyeIcon />}
          tip="Every successful page-load counts: humans, AI agents, social-platform previews, search-indexing bots. Each represents direct or downstream reach."
        >
          <strong className="text-[var(--color-ink)] tabular-nums">{fmt(totalReach)}</strong>{" "}
          <span className="text-[var(--color-ink-soft)]">total reach</span>
        </Row>

        <Row
          icon={<ActivityIcon />}
          tip="Counts visitors whose browser ran the JS tracker. A strict subset of total reach — used to gauge engagement quality, not reach."
        >
          {pulse.reading_now >= 1 ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <strong className="text-[var(--color-ink)] tabular-nums">{fmt(pulse.reading_now)}</strong>
              <span className="text-[var(--color-ink-soft)]">reading now</span>
            </span>
          ) : (
            <>
              <strong className="text-[var(--color-ink)] tabular-nums">0</strong>{" "}
              <span className="text-[var(--color-ink-soft)]">reading now</span>
            </>
          )}
          <span className="mx-1.5 text-[var(--color-muted)]">•</span>
          <strong className="text-[var(--color-ink)] tabular-nums">{fmt(pulse.today)}</strong>{" "}
          <span className="text-[var(--color-ink-soft)]">active 24h</span>
        </Row>

        <Row
          icon={<ShareIcon />}
          tip="Shares = clicks of the on-site Share button. Inbound = visitors who arrived here via a social platform (Facebook, Truth, X, Reddit, etc). They're tracked separately on purpose."
        >
          <strong className="text-[var(--color-ink)] tabular-nums">{fmt(shares)}</strong>{" "}
          <span className="text-[var(--color-ink-soft)]">{shares === 1 ? "share" : "shares"}</span>
          <span className="mx-1.5 text-[var(--color-muted)]">•</span>
          <strong className="text-[var(--color-ink)] tabular-nums">{fmt(inboundShares)}</strong>{" "}
          <span className="text-[var(--color-ink-soft)]">inbound</span>
        </Row>

        <Row
          icon={<CommentIcon />}
          tip="On-site comments only. Comments on social platforms (Facebook, X, etc.) happen there, not here, so they aren't counted."
        >
          <strong className="text-[var(--color-ink)] tabular-nums">{fmt(comments)}</strong>{" "}
          <span className="text-[var(--color-ink-soft)]">{comments === 1 ? "comment" : "comments"}</span>
        </Row>
      </ul>
    </div>
  );
}

function Row({
  icon,
  tip,
  children,
}: {
  icon: React.ReactNode;
  tip: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="text-[var(--color-muted)] shrink-0">{icon}</span>
      <span className="min-w-0">{children}</span>
      <InfoTip text={tip} />
    </li>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group shrink-0">
      <button
        type="button"
        aria-label={text}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--color-line)] text-[10px] font-bold leading-none text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus:outline-none focus:border-[var(--color-accent)] cursor-help"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 hidden w-64 -translate-x-1/2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-2.5 text-[11px] leading-snug text-[var(--color-ink-soft)] shadow-xl group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
