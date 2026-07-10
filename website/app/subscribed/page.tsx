import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Subscription confirmed",
  description: "Thanks for subscribing.",
  robots: { index: false, follow: false },
};

export default async function SubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const ok = status === "ok";

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 text-center">
      {ok ? (
        <>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            You&apos;re in.
          </h1>
          <p className="mt-4 text-base text-[var(--color-ink-soft)]">
            Subscription confirmed. I&apos;ll send an email when there&apos;s
            something new worth reading.
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Check your inbox for a welcome note.
          </p>
          <div className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-left">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-accent)]">
              While you&apos;re here
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Fighting Shadows — the full first-person account of the case this
              site documents. Early access is open now.
            </p>
            <Link
              href="/book/preorder"
              className="mt-3 inline-block font-semibold text-[var(--color-accent)] underline underline-offset-4"
            >
              Get the book →
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            That link didn&apos;t work.
          </h1>
          <p className="mt-4 text-base text-[var(--color-ink-soft)]">
            The confirmation link may have expired or already been used. Try
            subscribing again from the home page.
          </p>
        </>
      )}
      <p className="mt-8">
        <Link
          href="/"
          className="btn-accent inline-block rounded-lg px-5 py-2.5 text-sm"
        >
          Back to the feed
        </Link>
      </p>
    </article>
  );
}
