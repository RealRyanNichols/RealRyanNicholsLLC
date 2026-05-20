function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function PostStats({
  views,
  comments,
  size = "md",
}: {
  views: number;
  comments: number;
  size?: "sm" | "md";
}) {
  const cls =
    size === "sm"
      ? "flex items-center gap-3 text-xs text-[var(--color-muted)]"
      : "flex items-center gap-4 text-sm text-[var(--color-muted)]";
  const iconCls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={cls}>
      <span className="inline-flex items-center gap-1">
        <EyeIcon className={iconCls} />
        <span aria-label={`${views} views`}>
          <strong className="text-[var(--color-ink-soft)] font-semibold">{fmt(views)}</strong>
          {size === "md" ? <span className="ml-1">views</span> : null}
        </span>
      </span>
      <span className="inline-flex items-center gap-1">
        <CommentIcon className={iconCls} />
        <span aria-label={`${comments} comments`}>
          <strong className="text-[var(--color-ink-soft)] font-semibold">{fmt(comments)}</strong>
          {size === "md" ? <span className="ml-1">{comments === 1 ? "comment" : "comments"}</span> : null}
        </span>
      </span>
    </div>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
