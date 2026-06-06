import Link from "next/link";

/**
 * Compact cross-promo card that funnels site traffic to the /book waitlist.
 * Dark "book" aesthetic so it reads as a featured element on light pages
 * (homepage sidebar, /videos). Shows the cover, the title, and the
 * free-chapter hook.
 */
export function BookPromo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/book"
      className={`group block rounded-2xl border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea] transition hover:border-[#e1bd5b]/60 ${className}`}
    >
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uploads/book-cover.png"
          alt="Fighting Shadows — a memoir by Ryan Nichols"
          width={1000}
          height={1333}
          className="w-16 shrink-0 rounded border border-white/15 shadow-lg shadow-black/40"
        />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e1bd5b]">
            Coming 2026 · The book
          </p>
          <p className="mt-0.5 font-display text-xl font-black leading-none tracking-tight text-[#fdf8ea]">
            Fighting Shadows
          </p>
          <p className="mt-1.5 text-xs font-semibold leading-snug text-[#cfd9ea]">
            Join the waitlist — read the opening chapter{" "}
            <span className="font-black text-[#e1bd5b]">free</span>.{" "}
            <span className="whitespace-nowrap text-[#e1bd5b] group-hover:underline">
              Get on the list →
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
