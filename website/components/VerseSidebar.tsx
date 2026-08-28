import { VERSES, VERSE_KICKERS } from "@/lib/verses";
import { pickForToday } from "@/lib/rotation";

// The verse block. One verse a day, on Ryan's clock, from lib/verses.ts.
// Genesis 50:20 is still the anchor of the site — it is first in the bank
// and it comes back around — it just is not the only thing anyone ever
// sees here.
export function VerseSidebar({
  // Default keeps the historical look everywhere; the homepage passes a
  // quieter shell so the sidebar's money surfaces stand out instead.
  className = "rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5",
}: {
  className?: string;
}) {
  // Different offsets so the verse and its label do not turn over on the
  // same beat. 40 verses and 7 labels means the pairing stays fresh for
  // most of a year before it repeats exactly.
  const verse = pickForToday(VERSES, 0);
  const kicker = pickForToday(VERSE_KICKERS, 3);

  return (
    <aside className={className}>
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
        {kicker}
      </p>
      <blockquote className="text-lg leading-relaxed text-[var(--color-ink)] font-medium">
        &ldquo;{verse.text}&rdquo;
      </blockquote>
      <p className="mt-2 text-sm text-[var(--color-muted)]">— {verse.citation}</p>
    </aside>
  );
}
