import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribed",
  description: "You've been removed from the list.",
  robots: { index: false, follow: false },
};

export default async function UnsubscribedPage({
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
            You&apos;ve been unsubscribed.
          </h1>
          <p className="mt-4 text-base text-[var(--color-ink-soft)]">
            You won&apos;t get any more emails from this site. No hard feelings.
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Change your mind? You can sign up again any time.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            That link didn&apos;t work.
          </h1>
          <p className="mt-4 text-base text-[var(--color-ink-soft)]">
            The unsubscribe link may be invalid. If you&apos;re still getting
            emails, reply to one of them and I&apos;ll remove you manually.
          </p>
        </>
      )}
      <p className="mt-8">
        <Link
          href="/"
          className="btn-accent inline-block rounded-lg px-5 py-2.5 text-sm"
        >
          Back to the site
        </Link>
      </p>
    </article>
  );
}
