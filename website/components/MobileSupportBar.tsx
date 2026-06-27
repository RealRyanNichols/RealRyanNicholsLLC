import Link from "next/link";

export function MobileSupportBar() {
  return (
    <div
      data-mobile-support-bar
      className="rrn-mobile-support-bar fixed bottom-0 left-0 right-0 z-10 border-t border-[var(--color-line)] bg-[var(--color-paper)]/95 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-10px_28px_rgba(26,20,16,0.14)] backdrop-blur-xl lg:hidden"
    >
      <nav
        aria-label="Mobile quick actions"
        className="mx-auto grid max-w-md grid-cols-4 gap-2"
      >
        <Link
          href="/tell-your-story"
          data-track="mobile-bar-story"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#e1bd5b] bg-[#e1bd5b]/15 px-2 text-center text-xs font-black text-[#0e1a36]"
        >
          Story
        </Link>
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
          href="/#join"
          data-track="mobile-bar-join"
          className="btn-support inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-center text-xs font-black"
        >
          Join
        </Link>
      </nav>
    </div>
  );
}
