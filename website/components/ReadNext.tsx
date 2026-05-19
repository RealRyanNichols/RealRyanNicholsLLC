import Link from "next/link";
import { format } from "date-fns";
import type { Post } from "@/lib/types";

export function ReadNext({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-12 border-t border-[var(--color-line)] pt-8">
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-4">
        Read next
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border border-[var(--color-line)] bg-white p-5 hover:border-[var(--color-accent)] transition"
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
