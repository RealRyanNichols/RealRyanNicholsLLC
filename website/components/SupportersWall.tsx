import { format } from "date-fns";
import type { PublicSupporter } from "@/lib/supporters";
import { purposeLabel } from "@/lib/supporters";

export function SupportersWall({ supporters }: { supporters: PublicSupporter[] }) {
  if (!supporters.length) return null;

  const named = supporters.filter((s) => s.display_name);

  return (
    <section className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-8">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        The wall
      </p>
      <h2 className="font-display text-2xl sm:text-3xl mt-2 text-[var(--color-ink)]">
        People keeping this alive
      </h2>
      <p className="mt-3 text-sm text-[var(--color-ink-soft)] leading-relaxed">
        {supporters.length}{" "}
        {supporters.length === 1 ? "person has" : "people have"} stepped up
        {named.length > 0 ? " publicly" : ""}. Names, notes, and amounts show
        only where each supporter chose to share them — everything else stays
        private.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {supporters.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-bold text-[var(--color-ink)]">
                {s.display_name || "Anonymous supporter"}
              </span>
              {s.amount ? (
                <span className="shrink-0 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-accent)] tabular-nums">
                  ${s.amount}
                </span>
              ) : null}
            </div>
            <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
              {purposeLabel(s.purpose)}
            </span>
            {s.message ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-ink-soft)] leading-relaxed">
                &ldquo;{s.message}&rdquo;
              </p>
            ) : null}
            <time
              dateTime={s.created_at}
              className="mt-2 block text-[11px] text-[var(--color-muted)]"
            >
              {format(new Date(s.created_at), "MMMM d, yyyy")}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
