import Link from "next/link";

// The one way back to the case from a page that branches off it (the
// /story chapters). A quiet rail: where you came from, one tap to return,
// and an optional second link for the page's own parent. Shared so every
// branch page returns the same way.
export function CaseReturnRail({
  href = "/case",
  label = "Back to the case",
  ariaLabel = "Return to the case",
  crumb,
  secondary,
  className = "",
}: {
  href?: string;
  label?: string;
  // Landmark name; give the second rail on a page its own.
  ariaLabel?: string;
  // What this page is, in the case's terms ("The rescue record · chapter 3 of 12").
  crumb?: string;
  secondary?: { href: string; label: string };
  className?: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-y border-[var(--color-line)] py-1 text-sm ${className}`}
    >
      <Link
        href={href}
        className="inline-flex min-h-11 items-center gap-1.5 font-bold text-[var(--color-navy)] hover:underline"
      >
        <span aria-hidden>←</span>
        {label}
      </Link>
      {crumb ? (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
          {crumb}
        </span>
      ) : null}
      {secondary ? (
        <Link
          href={secondary.href}
          className="inline-flex min-h-11 items-center gap-1 font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-navy)] hover:underline"
        >
          {secondary.label}
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </nav>
  );
}
