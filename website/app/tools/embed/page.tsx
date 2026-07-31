import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { EmbedSnippet } from "@/components/EmbedSnippet";

export const metadata: Metadata = pageMetadata({
  title: "Embeddable widgets — put the archive on your site",
  description:
    "Free embeds: the J6 defendant lookup, live archive stats, and the case timeline. Copy one line of HTML and the record runs on your website, your Substack, your blog.",
  path: "/tools/embed",
});

// The widget hub: every embed is a doorway back into the archive from
// someone else's site. One iframe line each, no scripts, no tracking.

export default function EmbedHubPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-[var(--color-muted)]">
        <Link href="/tools" className="hover:underline">
          ← Tools
        </Link>{" "}
        ·{" "}
        <Link href="/case" className="hover:underline">
          The J6 Case
        </Link>
      </nav>

      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--color-accent)]">
        Free · Put the record on YOUR site
      </p>
      <h1 className="mt-2 font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
        The archive travels.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
        Run these on your own website, blog, or newsletter with one line of
        HTML. No scripts, no tracking, no permission needed. Every widget links
        back to the full record here.
      </p>

      <div className="mt-8 grid gap-5">
        <EmbedSnippet
          title="Find Your Case — defendant lookup"
          blurb="Your readers search all 1,571 indexed January 6 defendants by name, case number, or role, right on your page."
          path="/embed/find-your-case"
          height={420}
        />
        <EmbedSnippet
          title="Live archive stats"
          blurb="A compact live counter: people indexed, documents on file, grievances filed, days detained. Updates hourly."
          path="/embed/stats"
          height={140}
        />
        <EmbedSnippet
          title="Case timeline"
          blurb="The most recent dated events from United States v. Nichols, each linking to its full sourced event page."
          path="/embed/timeline"
          height={340}
        />
      </div>

      <section className="mt-10 rounded-2xl border-2 border-[var(--color-navy)]/30 bg-[var(--color-blue-soft)]/40 p-6 sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
          Why this exists
        </p>
        <p className="mt-2 max-w-2xl font-display text-xl font-bold leading-snug text-[var(--color-ink)] sm:text-2xl">
          A record that lives on one website can be ignored. A record running
          on a hundred websites cannot.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/case"
            className="btn-accent rounded-full px-5 py-2.5 text-sm font-bold"
          >
            See the full archive →
          </Link>
          <Link
            href="/tools/share-card"
            className="rounded-full border-2 border-[var(--color-navy)]/40 px-5 py-2.5 text-sm font-bold text-[var(--color-navy)] transition hover:border-[var(--color-navy)]"
          >
            Make a share card
          </Link>
        </div>
      </section>
    </article>
  );
}
