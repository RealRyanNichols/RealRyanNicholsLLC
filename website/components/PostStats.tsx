function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function PostStats({
  views,
  comments,
  shares,
  size = "md",
}: {
  views: number;
  comments: number;
  shares: number;
  size?: "sm" | "md";
}) {
  const cls =
    size === "sm"
      ? "flex items-center gap-3 text-xs text-[var(--color-muted)]"
      : "flex items-center gap-4 text-sm text-[var(--color-muted)]";
  const iconCls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={cls}>
      <Stat icon={<EyeIcon className={iconCls} />} value={views} label={size === "md" ? "views" : null} ariaLabel={`${views} views`} />
      <Stat icon={<CommentIcon className={iconCls} />} value={comments} label={size === "md" ? (comments === 1 ? "comment" : "comments") : null} ariaLabel={`${comments} comments`} />
      <Stat icon={<ShareIcon className={iconCls} />} value={shares} label={size === "md" ? (shares === 1 ? "share" : "shares") : null} ariaLabel={`${shares} shares`} />
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  ariaLabel,
}: {
  icon: React.ReactNode;
  value: number;
  label: string | null;
  ariaLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      <span aria-label={ariaLabel}>
        <strong className="text-[var(--color-ink-soft)] font-semibold">{fmt(value)}</strong>
        {label ? <span className="ml-1">{label}</span> : null}
      </span>
    </span>
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

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
