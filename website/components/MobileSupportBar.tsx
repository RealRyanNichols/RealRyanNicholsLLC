import Link from "next/link";

export function MobileSupportBar() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 border-t border-[var(--color-line)] bg-[var(--color-paper)]/95 px-3 py-2.5 shadow-[0_-10px_28px_rgba(26,20,16,0.14)] backdrop-blur-xl">
      <nav
        aria-label="Mobile quick actions"
        className="grid grid-cols-3 gap-2"
      >
        <Link
          href="/submit"
          data-track="mobile-bar-submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 text-center text-xs font-black text-[var(--color-ink)]"
        >
          Tip
        </Link>
        <Link
          href="/contact"
          data-track="mobile-bar-contact"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-blue)] bg-[var(--color-blue-soft)] px-2 text-center text-xs font-black text-[var(--color-blue)]"
        >
          Private
        </Link>
      <Link
        href="/support#support-mission"
        data-track="mobile-support-mission"
          className="btn-accent inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-center text-xs font-black"
      >
          Donate
      </Link>
      </nav>
    </div>
  );
}
