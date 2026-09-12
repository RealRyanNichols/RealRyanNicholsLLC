import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Nothing here.</h1>
      <div className="mx-auto mt-4 h-[3px] w-[4.5rem] bg-[var(--color-gold)]" aria-hidden />
      <p className="mt-4 text-[var(--color-ink-soft)]">
        That page either moved, never existed, or got pulled.
      </p>
      <Link
        href="/"
        className="btn-accent mt-6 inline-flex items-center rounded-full px-4 py-2 text-sm"
      >
        Back to the feed
      </Link>
    </div>
  );
}
