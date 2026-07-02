import Link from "next/link";
import { format } from "date-fns";
import type { Post } from "@/lib/types";

export type CaseLink = { href: string; title: string; sub: string };

export function ReadNext({
  posts,
  caseLinks = [],
}: {
  posts: Post[];
  // For case-related posts: 1-2 deep links into the evidence archive, so a
  // reader (or a crawler) can step from the story to the record behind it.
  caseLinks?: CaseLink[];
}) {
  if (posts.length === 0 && caseLinks.length === 0) return null;
  return (
    <section className="mt-12 border-t border-[var(--color-line)] pt-8">
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-4">
        Read next
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {caseLinks.map((c) => (
          <li
            key={c.href}
            className="rounded-2xl border border-[var(--color-navy)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-blue)] transition"
          >
            <Link href={c.href} className="block">
              <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-navy)]">
                From the case file
              </p>
              <h3 className="mt-1 font-semibold tracking-tight text-lg leading-snug">
                {c.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{c.sub}</p>
            </Link>
          </li>
        ))}
        {posts.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-accent)] transition"
          >
            <Link href={`/posts/${p.slug}`} className="block">
              <h3 className="font-semibold tracking-tight text-lg leading-snug">
                {p.title}
              </h3>
              {p.published_at && (
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  <time dateTime={p.published_at}>
                    {format(new Date(p.published_at), "MMMM d, yyyy")}
                  </time>
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
