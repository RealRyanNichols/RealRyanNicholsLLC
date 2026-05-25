import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout canceled",
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <article className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        No worries — nothing was charged.
      </h1>
      <p className="mt-4 text-[var(--color-ink-soft)] leading-relaxed">
        If you changed your mind, that&apos;s okay. You can still help by sharing
        a post, subscribing, or coming back when the time&apos;s right.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/support"
          className="btn-accent rounded-full px-6 py-3 font-bold"
        >
          Support another way →
        </Link>
        <Link
          href="/"
          className="rounded-full border-2 border-[var(--color-line)] px-6 py-3 font-bold hover:border-[var(--color-accent)]"
        >
          Back to the feed
        </Link>
      </div>
      <p className="mt-10 text-[var(--color-muted)] italic text-sm">
        &ldquo;As for you, you meant evil against me, but God meant it for
        good.&rdquo; — Genesis 50:20
      </p>
    </article>
  );
}
