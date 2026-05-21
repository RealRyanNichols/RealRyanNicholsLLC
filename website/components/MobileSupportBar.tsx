import Link from "next/link";

export function MobileSupportBar() {
  const donateUrl = process.env.NEXT_PUBLIC_DONATION_URL;
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-paper)]/95 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-bold">
          Help Ryan rebuild
        </p>
        <p className="text-xs text-[var(--color-ink-soft)] truncate">
          Rent · food · mental health care after pretrial detention.
        </p>
      </div>
      {donateUrl ? (
        <a
          href={donateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent inline-flex items-center rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap"
        >
          Donate
        </a>
      ) : (
        <Link
          href="/support"
          className="btn-accent inline-flex items-center rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap"
        >
          Help
        </Link>
      )}
    </div>
  );
}
