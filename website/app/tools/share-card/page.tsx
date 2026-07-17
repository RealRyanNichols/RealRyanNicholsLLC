import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { ShareCardTool } from "@/components/ShareCardTool";

export const metadata: Metadata = pageMetadata({
  title: "Share Card Generator — make the receipt travel",
  description:
    "Free tool: type a headline, pick dark board or cream paper, download a branded 1200×630 share card. Built for X, Facebook, Instagram, and texts — no design app needed.",
  path: "/tools/share-card",
});

export default function ShareCardPage() {
  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
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
        Free tool · Say it so it travels
      </p>
      <h1 className="mt-2 font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
        A billboard in your pocket.
        <br />
        Type it. Download it. Post it.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
        Screenshots get cropped and text posts get buried. A clean card
        doesn&apos;t. Put your headline on the same design this archive uses,
        add a number if you&apos;ve got one, and download a PNG built for X,
        Facebook, Instagram, and group texts. No design app. No signup. Free.
      </p>

      <div className="mt-8">
        <ShareCardTool />
      </div>

      <section className="mt-12 rounded-2xl border-2 border-[var(--color-navy)]/30 bg-[var(--color-blue-soft)]/40 p-6 sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
          Why this exists
        </p>
        <p className="mt-2 max-w-2xl font-display text-xl font-bold leading-snug text-[var(--color-ink)] sm:text-2xl">
          The truth doesn&apos;t spread on its own. Somebody has to put it in
          front of one more person — and it should look like it means it.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/tools/records-request"
            className="btn-accent rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Demand the record →
          </Link>
          <Link
            href="/case"
            className="rounded-full border-2 border-[var(--color-navy)]/40 px-5 py-2.5 text-sm font-bold text-[var(--color-navy)] transition hover:border-[var(--color-navy)]"
          >
            See the archive it comes from
          </Link>
        </div>
      </section>
    </article>
  );
}
