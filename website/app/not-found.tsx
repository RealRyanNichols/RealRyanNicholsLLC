import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-sm uppercase tracking-wider text-[var(--color-muted)]">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Nothing here.</h1>
      <p className="mt-3 text-[var(--color-ink-soft)]">
        That page either moved, never existed, or got pulled.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-full bg-[var(--color-ink)] px-4 py-2 text-white text-sm font-medium hover:bg-[var(--color-accent)] transition"
      >
        Back to the feed
      </Link>
    </div>
  );
}
