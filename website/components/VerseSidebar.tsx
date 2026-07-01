import { SITE } from "@/lib/site";

export function VerseSidebar({
  // Default keeps the historical look everywhere; the homepage passes a
  // quieter shell so the sidebar's money surfaces stand out instead.
  className = "rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5",
}: {
  className?: string;
}) {
  return (
    <aside className={className}>
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
        The verse I keep coming back to
      </p>
      <blockquote className="text-lg leading-relaxed text-[var(--color-ink)] font-medium">
        &ldquo;{SITE.verseSidebar.text}&rdquo;
      </blockquote>
      <p className="mt-2 text-sm text-[var(--color-muted)]">— {SITE.verseSidebar.citation}</p>
    </aside>
  );
}
